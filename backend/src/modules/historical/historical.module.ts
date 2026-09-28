import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HistoricalController } from './historical.controller';
import { HistoricalService } from './historical.service';
import { HistoricalReference, HistoricalReferenceSchema } from './schemas/historical-reference.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: HistoricalReference.name, schema: HistoricalReferenceSchema }]),
  ],
  controllers: [HistoricalController],
  providers: [HistoricalService],
  exports: [HistoricalService],
})
export class HistoricalModule {}
