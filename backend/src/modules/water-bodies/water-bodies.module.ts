import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WaterBody, WaterBodySchema } from './schemas/water-body.schema';
import { WaterBodiesService } from './water-bodies.service';
import { WaterBodiesController } from './water-bodies.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: WaterBody.name, schema: WaterBodySchema }])],
  providers: [WaterBodiesService],
  controllers: [WaterBodiesController],
  exports: [WaterBodiesService, MongooseModule],
})
export class WaterBodiesModule {}
