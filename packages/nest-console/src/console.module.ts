import { Module } from '@nestjs/common';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';

import { ConsoleService } from './console.service';

/** 提供 `ConsoleService` 与 `MetadataScanner` 的 Nest 模块。 */
@Module({
  providers: [MetadataScanner, ConsoleService],
  exports: [ConsoleService]
})
export class ConsoleModule {}
