import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { RequestInit } from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';

// eslint-disable-next-line import/no-extraneous-dependencies
import { NatFetchResponse } from '@sls-natgateway/shared';

export const getNatFetchRequest =
  (bucketName: string, client: S3Client) =>
  async (url: string, params: RequestInit): Promise<NatFetchResponse> => {
    const key = uuidv4();

    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: `${key}/request.json`,
        Body: JSON.stringify({
          url,
          params,
        }),
      }),
    );

    let retries = 10;
    let natS3Response: string | undefined;

    while (retries > 0 && natS3Response === undefined) {
      retries--;
      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        const { Body } = await client.send(
          new GetObjectCommand({
            Bucket: bucketName,
            Key: `${key}/response.json`,
          }),
        );

        if (Body !== undefined) {
          natS3Response = await Body.transformToString();
        }
      } catch {
        // ignore
      }
    }

    if (natS3Response === undefined) {
      throw new Error('Request did not come back in time');
    }

    const natResponse = JSON.parse(natS3Response) as NatFetchResponse;

    return natResponse;
  };
