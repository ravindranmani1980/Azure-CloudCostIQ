import express from 'express';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '5mb' }));

// Helper: Categorize cloud service name into FinOps bucket
function categorizeService(serviceName: string): 'compute' | 'storage' | 'networking' | 'database' | 'aiMl' | 'other' {
  const s = serviceName.toLowerCase();
  if (
    s.includes('ec2') ||
    s.includes('compute') ||
    s.includes('virtual machine') ||
    s.includes('kubernetes') ||
    s.includes('eks') ||
    s.includes('gke') ||
    s.includes('aks') ||
    s.includes('lambda') ||
    s.includes('cloud run') ||
    s.includes('container') ||
    s.includes('app service') ||
    s.includes('fargate')
  ) {
    return 'compute';
  }
  if (
    s.includes('s3') ||
    s.includes('storage') ||
    s.includes('ebs') ||
    s.includes('disk') ||
    s.includes('backup') ||
    s.includes('glacier') ||
    s.includes('blob') ||
    s.includes('filestore')
  ) {
    return 'storage';
  }
  if (
    s.includes('vpc') ||
    s.includes('network') ||
    s.includes('nat') ||
    s.includes('cloudfront') ||
    s.includes('cdn') ||
    s.includes('route 53') ||
    s.includes('dns') ||
    s.includes('load balanc') ||
    s.includes('bandwidth') ||
    s.includes('egress') ||
    s.includes('front door') ||
    s.includes('expressroute')
  ) {
    return 'networking';
  }
  if (
    s.includes('rds') ||
    s.includes('sql') ||
    s.includes('database') ||
    s.includes('dynamodb') ||
    s.includes('bigquery') ||
    s.includes('cosmos') ||
    s.includes('spanner') ||
    s.includes('redis') ||
    s.includes('elasticache') ||
    s.includes('aurora')
  ) {
    return 'database';
  }
  if (
    s.includes('openai') ||
    s.includes('ai') ||
    s.includes('vertex') ||
    s.includes('sagemaker') ||
    s.includes('bedrock') ||
    s.includes('tpu') ||
    s.includes('cognitive') ||
    s.includes('machine learning')
  ) {
    return 'aiMl';
  }
  return 'other';
}

// Helper: Current month start/end ISO strings (YYYY-MM-DD)
function getCurrentMonthDateRange(): { start: string; end: string } {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(Math.max(2, now.getUTCDate())).padStart(2, '0');
  return {
    start: `${year}-${month}-01`,
    end: `${year}-${month}-${day}`,
  };
}

// Helper: AWS SigV4 Signing for AWS Cost Explorer (ce.us-east-1.amazonaws.com)
function signAwsSigV4({
  accessKeyId,
  secretAccessKey,
  sessionToken,
  region = 'us-east-1',
  service = 'ce',
  host = 'ce.us-east-1.amazonaws.com',
  target = 'AWSInsightsIndexService.GetCostAndUsage',
  payload,
}: {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  region?: string;
  service?: string;
  host?: string;
  target?: string;
  payload: string;
}) {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);

  const payloadHash = crypto.createHash('sha256').update(payload, 'utf8').digest('hex');

  const headers: Record<string, string> = {
    'content-type': 'application/x-amz-json-1.1',
    host,
    'x-amz-date': amzDate,
    'x-amz-target': target,
  };

  if (sessionToken) {
    headers['x-amz-security-token'] = sessionToken;
  }

  const sortedHeaderKeys = Object.keys(headers).sort();
  const canonicalHeaders = sortedHeaderKeys.map((k) => `${k}:${headers[k].trim()}\n`).join('');
  const signedHeaders = sortedHeaderKeys.join(';');

  const canonicalRequest = [
    'POST',
    '/',
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    crypto.createHash('sha256').update(canonicalRequest, 'utf8').digest('hex'),
  ].join('\n');

  const hmac = (key: Buffer | string, data: string) =>
    crypto.createHmac('sha256', key).update(data, 'utf8').digest();

  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, 'aws4_request');
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign, 'utf8').digest('hex');

  const authorizationHeader = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/x-amz-json-1.1',
    'X-Amz-Date': amzDate,
    'X-Amz-Target': target,
    Authorization: authorizationHeader,
  };

  if (sessionToken) {
    requestHeaders['X-Amz-Security-Token'] = sessionToken;
  }

  return requestHeaders;
}

// Helper: Sign GCP Service Account JWT for OAuth2 Access Token
async function getGcpAccessTokenFromServiceAccount(serviceAccountJsonStr: string): Promise<string> {
  const sa = JSON.parse(serviceAccountJsonStr);
  if (!sa.client_email || !sa.private_key) {
    throw new Error('Service Account JSON must contain client_email and private_key.');
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claimSet = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-billing.readonly https://www.googleapis.com/auth/bigquery.readonly',
    aud: sa.token_uri || 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const base64UrlEncode = (obj: unknown) =>
    Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

  const unsignedJwt = `${base64UrlEncode(header)}.${base64UrlEncode(claimSet)}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsignedJwt);
  signer.end();

  const signature = signer
    .sign(sa.private_key, 'base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const assertion = `${unsignedJwt}.${signature}`;

  const tokenResp = await fetch(sa.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }).toString(),
  });

  const tokenData = (await tokenResp.json()) as Record<string, unknown>;
  if (!tokenResp.ok || !tokenData.access_token) {
    throw new Error(
      `GCP OAuth2 token exchange failed (${tokenResp.status}): ${
        (tokenData.error_description as string) || (tokenData.error as string) || JSON.stringify(tokenData)
      }`
    );
  }

  return tokenData.access_token as string;
}

// GET /api/cloud/env-status — Check which server env credentials are pre-configured
app.get('/api/cloud/env-status', (_req, res) => {
  res.json({
    azureConfigured: Boolean(
      (process.env.AZURE_TENANT_ID && process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET && process.env.AZURE_SUBSCRIPTION_ID) ||
        (process.env.AZURE_BEARER_TOKEN && process.env.AZURE_SUBSCRIPTION_ID)
    ),
    awsConfigured: Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
    gcpConfigured: Boolean(process.env.GCP_SERVICE_ACCOUNT_JSON || process.env.GCP_ACCESS_TOKEN),
  });
});

// POST /api/cloud/connect — Live direct connection & real-time cost query for Azure, AWS, and GCP
app.post('/api/cloud/connect', async (req, res) => {
  const startTime = Date.now();
  const { provider, credentials } = req.body as {
    provider: 'AWS' | 'GCP' | 'Azure';
    credentials?: Record<string, string>;
  };

  try {
    // =========================================================================
    // 1. MICROSOFT AZURE COST MANAGEMENT LIVE CONNECTOR
    // =========================================================================
    if (provider === 'Azure') {
      const tenantId = credentials?.tenantId?.trim() || process.env.AZURE_TENANT_ID || '';
      const clientId = credentials?.clientId?.trim() || process.env.AZURE_CLIENT_ID || '';
      const clientSecret = credentials?.clientSecret?.trim() || process.env.AZURE_CLIENT_SECRET || '';
      const subscriptionId = (credentials?.subscriptionId?.trim() || process.env.AZURE_SUBSCRIPTION_ID || '').replace(/^\/subscriptions\//i, '');
      let bearerToken = credentials?.bearerToken?.trim() || process.env.AZURE_BEARER_TOKEN || '';

      if (!subscriptionId) {
        return res.status(400).json({
          ok: false,
          provider: 'Azure',
          statusCode: 400,
          latencyMs: Date.now() - startTime,
          error: 'Azure Subscription ID is required (e.g., 9b4a11-e40-410a-xxxx-xxxxxxxxxxxx).',
        });
      }

      // Exchange Service Principal credentials for Entra ID OAuth2 Bearer token if no direct token given
      if (!bearerToken) {
        if (!tenantId || !clientId || !clientSecret) {
          return res.status(400).json({
            ok: false,
            provider: 'Azure',
            statusCode: 400,
            latencyMs: Date.now() - startTime,
            error: 'Provide either an Azure Bearer Token OR Service Principal credentials (Tenant ID, Client ID, Client Secret).',
          });
        }

        const tokenUrl = `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`;
        const tokenResp = await fetch(tokenUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: clientId,
            client_secret: clientSecret,
            scope: 'https://management.azure.com/.default',
          }).toString(),
        });

        const tokenJson = (await tokenResp.json()) as Record<string, unknown>;
        if (!tokenResp.ok || !tokenJson.access_token) {
          return res.status(tokenResp.status || 401).json({
            ok: false,
            provider: 'Azure',
            statusCode: tokenResp.status || 401,
            latencyMs: Date.now() - startTime,
            error: `Azure AD OAuth2 authentication failed: ${(tokenJson.error_description as string) || (tokenJson.error as string) || 'Invalid credentials'}`,
            rawPayload: tokenJson,
          });
        }
        bearerToken = tokenJson.access_token as string;
      }

      const timeframe = credentials?.timeframe?.trim() || 'MonthToDate';
      const startDate = credentials?.startDate?.trim() || '';
      const endDate = credentials?.endDate?.trim() || '';
      const customEndpoint = credentials?.customEndpoint?.trim() || '';

      // Query Azure Cost Management REST API
      const endpoint =
        customEndpoint ||
        `https://management.azure.com/subscriptions/${encodeURIComponent(
          subscriptionId
        )}/providers/Microsoft.CostManagement/query?api-version=2023-11-01`;

      const queryBody: Record<string, unknown> = {
        type: 'ActualCost',
        timeframe,
        dataset: {
          granularity: credentials?.granularity === 'Daily' ? 'Daily' : 'None',
          aggregation: {
            totalCost: {
              name: 'Cost',
              function: 'Sum',
            },
          },
          grouping: [
            {
              type: 'Dimension',
              name: 'ServiceName',
            },
          ],
        },
      };

      if (timeframe === 'Custom' && startDate && endDate) {
        queryBody.timePeriod = {
          from: `${startDate}T00:00:00Z`,
          to: `${endDate}T23:59:59Z`,
        };
      }

      const costResp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(queryBody),
      });

      const costJson = (await costResp.json()) as Record<string, any>;
      const latencyMs = Date.now() - startTime;

      if (!costResp.ok) {
        return res.status(costResp.status).json({
          ok: false,
          provider: 'Azure',
          statusCode: costResp.status,
          latencyMs,
          endpoint,
          error:
            costJson?.error?.message ||
            `Azure Cost Management API returned HTTP ${costResp.status}`,
          rawPayload: costJson,
        });
      }

      // Parse Azure Cost Management rows: typically [Cost, ServiceName, Currency]
      const rows: any[][] = costJson?.properties?.rows || [];
      const columns: { name: string; type: string }[] = costJson?.properties?.columns || [];
      const costIdx = Math.max(0, columns.findIndex((c) => c.name.toLowerCase().includes('cost')));
      const serviceIdx = columns.findIndex((c) => c.name.toLowerCase().includes('service'));

      let totalSpend = 0;
      const categories = { compute: 0, storage: 0, networking: 0, database: 0, aiMl: 0, other: 0 };
      const servicesBreakdown: { service: string; spend: number }[] = [];

      for (const row of rows) {
        const amount = parseFloat(String(row[costIdx] ?? 0)) || 0;
        const serviceName = String(serviceIdx >= 0 ? row[serviceIdx] : 'Azure Resource');
        totalSpend += amount;
        const cat = categorizeService(serviceName);
        categories[cat] += amount;
        servicesBreakdown.push({ service: serviceName, spend: Math.round(amount * 100) / 100 });
      }

      totalSpend = Math.round(totalSpend * 100) / 100;

      return res.json({
        ok: true,
        provider: 'Azure',
        statusCode: costResp.status,
        latencyMs,
        endpoint,
        credentialsMasked: clientId
          ? `spn:${clientId.slice(0, 8)}**** (Sub: ${subscriptionId.slice(0, 8)}...)`
          : `Bearer Token (Sub: ${subscriptionId.slice(0, 8)}...)`,
        totalSpend,
        lineItemsCount: rows.length,
        categories,
        servicesBreakdown: servicesBreakdown.sort((a, b) => b.spend - a.spend).slice(0, 10),
        rawPayload: costJson,
      });
    }

    // =========================================================================
    // 2. AMAZON WEB SERVICES (AWS) COST EXPLORER LIVE CONNECTOR (SigV4)
    // =========================================================================
    if (provider === 'AWS') {
      const accessKeyId = credentials?.accessKeyId?.trim() || process.env.AWS_ACCESS_KEY_ID || '';
      const secretAccessKey = credentials?.secretAccessKey?.trim() || process.env.AWS_SECRET_ACCESS_KEY || '';
      const sessionToken = credentials?.sessionToken?.trim() || process.env.AWS_SESSION_TOKEN || undefined;
      const region = credentials?.region?.trim() || process.env.AWS_REGION || 'us-east-1';
      const granularity = (credentials?.granularity?.trim()?.toUpperCase() === 'DAILY' ? 'DAILY' : 'MONTHLY') as 'MONTHLY' | 'DAILY';
      const costMetric = credentials?.costMetric?.trim() || 'UnblendedCost';
      const accountId = credentials?.accountId?.trim() || '';

      if (!accessKeyId || !secretAccessKey) {
        return res.status(400).json({
          ok: false,
          provider: 'AWS',
          statusCode: 400,
          latencyMs: Date.now() - startTime,
          error: 'AWS Access Key ID and Secret Access Key are required for SigV4 Cost Explorer authentication.',
        });
      }

      const defaultRange = getCurrentMonthDateRange();
      const start = credentials?.startDate?.trim() || defaultRange.start;
      const end = credentials?.endDate?.trim() || defaultRange.end;

      const payloadObj: Record<string, unknown> = {
        TimePeriod: { Start: start, End: end },
        Granularity: granularity,
        Metrics: [costMetric],
        GroupBy: [{ Type: 'DIMENSION', Key: 'SERVICE' }],
      };

      if (accountId) {
        payloadObj.Filter = {
          Dimensions: {
            Key: 'LINKED_ACCOUNT',
            Values: [accountId],
          },
        };
      }

      const payload = JSON.stringify(payloadObj);
      const endpoint = 'https://ce.us-east-1.amazonaws.com/';

      const signedHeaders = signAwsSigV4({
        accessKeyId,
        secretAccessKey,
        sessionToken,
        region: 'us-east-1', // Cost Explorer is a global service hosted in us-east-1
        service: 'ce',
        host: 'ce.us-east-1.amazonaws.com',
        target: 'AWSInsightsIndexService.GetCostAndUsage',
        payload,
      });

      const awsResp = await fetch(endpoint, {
        method: 'POST',
        headers: signedHeaders,
        body: payload,
      });

      const awsJson = (await awsResp.json()) as Record<string, any>;
      const latencyMs = Date.now() - startTime;

      if (!awsResp.ok) {
        return res.status(awsResp.status).json({
          ok: false,
          provider: 'AWS',
          statusCode: awsResp.status,
          latencyMs,
          endpoint,
          error:
            awsJson?.Message ||
            awsJson?.message ||
            awsJson?.__type ||
            `AWS Cost Explorer returned HTTP ${awsResp.status}`,
          rawPayload: awsJson,
        });
      }

      const resultsByTime: any[] = awsJson?.ResultsByTime || [];
      let totalSpend = 0;
      const categories = { compute: 0, storage: 0, networking: 0, database: 0, aiMl: 0, other: 0 };
      const serviceTotalsMap: Record<string, number> = {};

      for (const period of resultsByTime) {
        const groups: any[] = period?.Groups || [];
        for (const g of groups) {
          const serviceName = String(g?.Keys?.[0] || 'AWS Service');
          const metricObj = g?.Metrics?.[costMetric] || g?.Metrics?.UnblendedCost || g?.Metrics?.BlendedCost;
          const amount = parseFloat(metricObj?.Amount || '0') || 0;
          totalSpend += amount;
          const cat = categorizeService(serviceName);
          categories[cat] += amount;
          serviceTotalsMap[serviceName] = (serviceTotalsMap[serviceName] || 0) + amount;
        }
      }

      const servicesBreakdown = Object.entries(serviceTotalsMap).map(([service, spend]) => ({
        service,
        spend: Math.round(spend * 100) / 100,
      }));

      totalSpend = Math.round(totalSpend * 100) / 100;

      return res.json({
        ok: true,
        provider: 'AWS',
        statusCode: awsResp.status,
        latencyMs,
        endpoint: `${endpoint} (Region: ${region}${accountId ? ` · Acct: ${accountId}` : ''})`,
        credentialsMasked: `AKIA/ASIA: ${accessKeyId.slice(0, 6)}****${accessKeyId.slice(-2)}`,
        totalSpend,
        lineItemsCount: servicesBreakdown.length,
        categories,
        servicesBreakdown: servicesBreakdown.sort((a, b) => b.spend - a.spend).slice(0, 10),
        rawPayload: awsJson,
      });
    }

    // =========================================================================
    // 3. GOOGLE CLOUD PLATFORM (GCP) CLOUD BILLING & BIGQUERY LIVE CONNECTOR
    // =========================================================================
    if (provider === 'GCP') {
      const serviceAccountJson =
        credentials?.serviceAccountJson?.trim() || process.env.GCP_SERVICE_ACCOUNT_JSON || '';
      let accessToken = credentials?.accessToken?.trim() || process.env.GCP_ACCESS_TOKEN || '';
      const billingAccountId = (
        credentials?.billingAccountId?.trim() ||
        process.env.GCP_BILLING_ACCOUNT_ID ||
        ''
      ).replace(/^billingAccounts\//i, '');
      const projectId = credentials?.projectId?.trim() || process.env.GCP_PROJECT_ID || '';
      const bigQueryTable =
        credentials?.bigQueryTable?.trim() || process.env.GCP_BIGQUERY_BILLING_TABLE || '';

      if (!accessToken) {
        if (!serviceAccountJson) {
          return res.status(400).json({
            ok: false,
            provider: 'GCP',
            statusCode: 400,
            latencyMs: Date.now() - startTime,
            error:
              'Provide either a GCP OAuth2 Access Token (gcloud auth print-access-token) OR a Service Account JSON key.',
          });
        }
        accessToken = await getGcpAccessTokenFromServiceAccount(serviceAccountJson);
      }

      // Step 1: Verify Cloud Billing Account via Cloud Billing REST API v1
      const billingUrl = billingAccountId
        ? `https://cloudbilling.googleapis.com/v1/billingAccounts/${encodeURIComponent(billingAccountId)}`
        : 'https://cloudbilling.googleapis.com/v1/billingAccounts';

      const billingResp = await fetch(billingUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      const billingJson = (await billingResp.json()) as Record<string, any>;

      if (!billingResp.ok) {
        return res.status(billingResp.status).json({
          ok: false,
          provider: 'GCP',
          statusCode: billingResp.status,
          latencyMs: Date.now() - startTime,
          endpoint: billingUrl,
          error:
            billingJson?.error?.message ||
            `GCP Cloud Billing API returned HTTP ${billingResp.status}`,
          rawPayload: billingJson,
        });
      }

      let totalSpend = 0;
      let lineItemsCount = 1;
      const categories = { compute: 0, storage: 0, networking: 0, database: 0, aiMl: 0, other: 0 };
      const servicesBreakdown: { service: string; spend: number }[] = [];
      let combinedPayload: Record<string, unknown> = { billingAccount: billingJson };

      // Step 2: If BigQuery Project ID and Billing Export Table are configured, run live SQL aggregation
      if (projectId && bigQueryTable) {
        const bqEndpoint = `https://bigquery.googleapis.com/bigquery/v2/projects/${encodeURIComponent(
          projectId
        )}/queries`;
        const sqlQuery = `
          SELECT
            service.description AS service_name,
            SUM(cost) AS total_cost
          FROM \`${bigQueryTable.replace(/`/g, '')}\`
          WHERE _PARTITIONTIME >= TIMESTAMP_TRUNC(CURRENT_TIMESTAMP(), MONTH)
          GROUP BY 1
          ORDER BY 2 DESC
          LIMIT 25
        `;

        const bqResp = await fetch(bqEndpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: sqlQuery,
            useLegacySql: false,
          }),
        });

        const bqJson = (await bqResp.json()) as Record<string, any>;
        combinedPayload = { billingAccount: billingJson, bigQueryCostResult: bqJson };

        if (bqResp.ok && Array.isArray(bqJson.rows)) {
          lineItemsCount = bqJson.rows.length;
          for (const r of bqJson.rows) {
            const serviceName = String(r?.f?.[0]?.v || 'GCP Service');
            const amount = parseFloat(String(r?.f?.[1]?.v || '0')) || 0;
            totalSpend += amount;
            const cat = categorizeService(serviceName);
            categories[cat] += amount;
            servicesBreakdown.push({ service: serviceName, spend: Math.round(amount * 100) / 100 });
          }
        }
      }

      totalSpend = Math.round(totalSpend * 100) / 100;

      return res.json({
        ok: true,
        provider: 'GCP',
        statusCode: billingResp.status,
        latencyMs: Date.now() - startTime,
        endpoint: billingUrl,
        credentialsMasked: billingAccountId
          ? `BillingAccount: ${billingAccountId}`
          : 'GCP Cloud Billing OAuth2 Verified',
        totalSpend,
        lineItemsCount,
        categories,
        servicesBreakdown,
        rawPayload: combinedPayload,
      });
    }

    return res.status(400).json({
      ok: false,
      error: `Unsupported provider: ${provider}`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({
      ok: false,
      provider,
      statusCode: 500,
      latencyMs: Date.now() - startTime,
      error: message,
    });
  }
});

async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Maniq | Spend server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
