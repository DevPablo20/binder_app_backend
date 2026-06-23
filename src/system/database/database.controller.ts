import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { layerTag, Layer } from 'src/shared/swagger/layer-tags';

@ApiTags(layerTag(Layer.System, 'Database'))
@Controller('system/database')
export class DatabaseController {}
