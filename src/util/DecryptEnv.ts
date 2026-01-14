import { KMSClient, DecryptCommand } from "@aws-sdk/client-kms";

const client = new KMSClient({region: 'eu-central-1'});

export async function decryptEnvVar(name) {
  try {
    const encrypted = process.env[name];
    const req = {
      CiphertextBlob: Buffer.from(encrypted, 'base64'),
      EncryptionContext: { LambdaFunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME },
    };
    const command = new DecryptCommand(req);
    const response = await client.send(command);
    const decrypted = new TextDecoder().decode(response.Plaintext);

    process.env[name] = decrypted;
    return decrypted;
  } catch (err) {
    console.log('Decrypt error:', err);
    throw err;
  }
}
