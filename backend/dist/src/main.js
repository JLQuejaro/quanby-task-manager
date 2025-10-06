"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    console.log('🔍 DATABASE_URL loaded:', process.env.DATABASE_URL ? '✅ Yes' : '❌ No');
    if (process.env.DATABASE_URL) {
        console.log('🔗 Connection:', process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@'));
    }
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors();
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Quanby Task Manager API')
        .setDescription('Task management system REST API')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`\n🚀 Application is running on: http://localhost:${port}`);
    console.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs\n`);
}
bootstrap();
//# sourceMappingURL=main.js.map