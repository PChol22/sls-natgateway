/// <reference lib="dom" />
// The runtime of this specific Lambda is Node18.x so we can use the Fetch API

/* eslint-disable import/no-extraneous-dependencies */
// The runtime of this specific Lambda is Node18.x so @aws-sdk/client-s3 isn't a dependency
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

import { NatFetchResponse } from '@sls-natgateway/shared';

const client = new S3Client({});

export const handler = async ({
  Records,
}: {
  Records: {
    s3: {
      object: {
        key: string;
      };
    };
  }[];
}): Promise<void> => {
  const bucketName = process.env.BUCKET_NAME;

  if (bucketName === undefined) {
    throw new Error('BUCKET_NAME is not defined');
  }

  await Promise.all(
    Records.map(
      async ({
        s3: {
          object: { key },
        },
      }) => {
        const responseKey = key.split('/')[0];

        if (responseKey === undefined) {
          throw new Error('Request fileKey is malformed');
        }

        const { Body } = await client.send(
          new GetObjectCommand({
            Bucket: bucketName,
            Key: key,
          }),
        );

        if (Body === undefined) {
          throw new Error('Body is undefined');
        }

        const { url, params } = JSON.parse(await Body.transformToString()) as {
          url: string;
          params: RequestInit;
        };

        const data = await fetch(url, params);

        const natResponse: NatFetchResponse = {
          status: data.status,
          body: JSON.stringify(await data.json()),
        };

        await client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: `${responseKey}/response.json`,
            Body: JSON.stringify(natResponse),
          }),
        );
      },
    ),
  );
};
