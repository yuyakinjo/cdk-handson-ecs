import { z } from 'zod';

export const envSchema = z.object({
  subDomain: z.string().min(1),
  domainName: z.string().min(1),
  certificateArn: z.string().min(1),
  issuer: z.string().min(1),
  authorizationEndpoint: z.string().min(1),
  tokenEndpoint: z.string().min(1),
  userInfoEndpoint: z.string().min(1),
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
});
