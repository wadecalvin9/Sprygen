/**
 * Direct generator test using compiled dist output as a library.
 * Bypasses the CLI and calls ProjectGenerator programmatically.
 */
import { ProjectGenerator } from './src/generator/ProjectGenerator';
import path from 'path';
import fs from 'fs-extra';

async function runTest(projectName: string) {
  // Clean pre-existing test artifact
  const testDir = path.resolve(process.cwd(), projectName);
  if (await fs.pathExists(testDir)) {
    console.log(`Removing existing "${projectName}" directory...`);
    await fs.remove(testDir);
  }

  const options = {
    projectName,
    packageName: 'com.example.demo',
    packagePath: 'com/example/demo',
    database: 'postgresql' as const,
    buildTool: 'maven' as const,
    modules: ['Swagger', 'Logging'],
    javaVersion: '21',
    springBootVersion: '3.2.4',
    description: 'Auto-generated test project',
  };

  console.log(`\nGenerating "${projectName}" via Spring Initializr...`);
  const gen = new ProjectGenerator();
  await gen.generate(options);
  console.log('\n✅ Generation complete!');

  // Validate key expected files
  const expectations = [
    `${projectName}/pom.xml`,
    `${projectName}/src/main/java/com/example/demo/config/SecurityConfig.java`,
    `${projectName}/src/main/java/com/example/demo/service/JwtService.java`,
    `${projectName}/src/main/java/com/example/demo/security/JwtAuthFilter.java`,
    `${projectName}/src/main/java/com/example/demo/entity/User.java`,
    `${projectName}/src/main/resources/application.yml`,
    `${projectName}/src/main/resources/logback-spring.xml`,
  ];

  console.log('\nValidating generated files:');
  let allGood = true;
  for (const f of expectations) {
    const exists = await fs.pathExists(path.resolve(process.cwd(), f));
    console.log(`  ${exists ? '✅' : '❌'} ${f}`);
    if (!exists) allGood = false;
  }

  if (allGood) {
    console.log('\n🎉 All expected files present. Integration test PASSED.');
  } else {
    console.error('\n❌ Some files are missing. Integration test FAILED.');
    process.exit(1);
  }
}

runTest('sprygen-test-output').catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
