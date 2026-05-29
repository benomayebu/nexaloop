import { IsUrl, IsArray, IsString, ArrayNotEmpty } from 'class-validator';

export class CreateWebhookDto {
  @IsUrl({ require_tld: false }) // allow localhost for dev
  url: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  events: string[];
}
