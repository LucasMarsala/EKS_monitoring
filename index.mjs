import { EKSClient, ListClustersCommand, DescribeClusterVersionsCommand, DescribeClusterCommand } from "@aws-sdk/client-eks";
import { EC2Client, DescribeRegionsCommand } from "@aws-sdk/client-ec2";
import { CloudWatchClient } from '@aws-sdk/client-cloudwatch';
import { PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

async function getEKSSupportedVersion() {
    try {
        const client = new EKSClient({});
        const command = new DescribeClusterVersionsCommand({});
        const { clusterVersions } = await client.send(command);

        return clusterVersions;
    } catch (error) {
        console.error(`Error getting supported EKS versions:`, error);
        throw error;
    }
}

async function getAWSRegions() {
    try {
        const client = new EC2Client({ region: "us-west-2" });
        const command = new DescribeRegionsCommand({});
        const { Regions } = await client.send(command);

        return (Regions.map(r => r.RegionName));
    } catch (error) {
        console.error("Error fetching all aws regions");
        throw error;
    }
}

async function getEKSRegions(regions) {
    try {
        const res = await Promise.all(regions.map(async (region) => {
            try {
                const client = new EKSClient({ region });
                const command = new ListClustersCommand({});
                const { clusters } = await client.send(command);

                if (clusters.length > 0) {
                    return { region };
                }
            } catch (error) {
                console.error(`Error fetching EKS cluster in ${region}:`, error);
            }
        })).then(results => results.filter(Boolean));
        return res;
    } catch (error) {
        throw error;
    }
}

async function getEKSClusterVersion(client, name) {
    try {
        const command = new DescribeClusterCommand({ name });
        const { cluster } = await client.send(command);

        return cluster.version;
    } catch (error) {
        console.error(`Error fetching EKS cluster version:`, error);
        throw error;
    }

}

async function getEKSClusters(region) {
    try {
        const { region: regionName } = region;
        const client = new EKSClient({ regionName });
        const clusters = []
        let nextToken = 1;

        while (nextToken) {
            const command = new ListClustersCommand({});
            const res = await client.send(command);
            clusters.push(...res.clusters);
            nextToken = res.nextToken;
        }
        const response = await Promise.all(clusters.map(async (cluster) => {
            return { region: regionName, clusterName: cluster, clusterVersion: await getEKSClusterVersion(client, cluster) };
        }));
        return response;
    } catch (error) {
        console.error(`Error fetching EKS cluster versions:`, error);
        throw error;
    }
}

//time diff is 15 days, but you can change it to 30 days or 45 days or 60 days depeding on your needs

async function checkEksVersion(EKSSupportVersion, EKSClusters) {
    try {
        const now = new Date();
        const timeDiff = 1000 * 60 * 60 * 24 * 15;
        const res = EKSClusters.reduce((acc, cluster) => {
            const version = EKSSupportVersion.find((v) => v.clusterVersion === cluster.clusterVersion);

            if (!version || !version.status === "UNSUPPORTED") {
                return { ...acc, deprecated: acc.deprecated + 1 };
            }
            if (version.status === "STANDARD_SUPPORT") {
                const end = new Date(version.endOfStandardSupportDate);

                if (end.getTime() - now.getTime() > timeDiff)
                    return { ...acc, ok: acc.ok + 1 };
                return { ...acc, soonExtended: acc.soonExtended + 1 };
            } else if (version.status === "EXTENDED_SUPPORT") {
                const end = new Date(version.endOfExtendedSupportDate);

                if (end.getTime() - now.getTime() > timeDiff) {
                    return { ...acc, extended: acc.extended + 1 };
                }
                return { ...acc, soonDeprecated: acc.soonDeprecated + 1 };
            }
            return acc;
        }, { ok: 0, soonExtended: 0, extended: 0, soonDeprecated: 0, deprecated: 0 });
        return res;
    } catch (error) {
        console.log("Error while checking eks versions");
        throw error;
    }
}

async function setupCloudWatchMetrics(metrics) {
    try {
        const params = {
            Namespace: process.env.CLOUDWATCH_NAMESPACE || 'EKS/ClusterVersions',
            MetricData: [
                { MetricName: 'OK', Value: metrics.ok, Unit: 'Count' },
                { MetricName: 'SoonExtended', Value: metrics.soonExtended, Unit: 'Count', },
                { MetricName: 'Extended', Value: metrics.extended, Unit: 'Count' },
                { MetricName: 'SoonDeprecated', Value: metrics.soonDeprecated, Unit: 'Count', },
                { MetricName: 'Deprecated', Value: metrics.deprecated, Unit: 'Count' },
            ]
        };
        return params;
    } catch (error) {
        throw error;
    }
}

export const handler = async () => {
    const regions = await getAWSRegions();
    const EKSRegions = await getEKSRegions(regions);
    const EKSSupportVersion = await getEKSSupportedVersion();
    const EKSClusters = (await Promise.all(EKSRegions.map(region => getEKSClusters(region)))).flat();
    const metrics = await checkEksVersion(EKSSupportVersion, EKSClusters);
    const alarm = await setupCloudWatchMetrics(metrics);
    try {
        const client = new CloudWatchClient({ region: "us-west-2" });
        const command = new PutMetricDataCommand(alarm);
        await client.send(command);
    } catch (error) {
        throw error
    }
    return { metrics };
};