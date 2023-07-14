import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import fs from 'fs';
import path from 'path';

const a = fs.readFileSync(path.join(__dirname, 'lambda.cjs'), 'utf8');

export class SlsNatGatewayConstruct extends Construct {
  public bucket: cdk.aws_s3.Bucket;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const outsideBucket = new cdk.aws_s3.Bucket(this, 'SlsNatGatewayBucket', {
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(1),
        },
      ],
    });

    const outsideLambda = new cdk.aws_lambda.Function(
      this,
      'SlsNatGatewayLambda',
      {
        runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: cdk.aws_lambda.Code.fromInline(a),
        environment: {
          BUCKET_NAME: outsideBucket.bucketName,
        },
      },
    );

    outsideBucket.addEventNotification(
      cdk.aws_s3.EventType.OBJECT_CREATED,
      new cdk.aws_s3_notifications.LambdaDestination(outsideLambda),
      {
        suffix: '/request.json',
      },
    );

    outsideBucket.grantReadWrite(outsideLambda);

    this.bucket = outsideBucket;
  }
}
