import swaggerAutoGen from "swagger-autogen";

const doc = {
  info: {
    title: "Edvance API",
    description: "Edvance API",
    version: "1.0.0"
  },
  host: `localhost:3000`,
  schemes: ["http"]
};

const outputFile = "./src/docs/swagger.json";
const endpointsFiles = ["./src/routes/*.ts", "./src/modules/*/*.routes.ts"];

swaggerAutoGen(outputFile, endpointsFiles, doc);
