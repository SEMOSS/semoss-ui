const fs = require('fs-extra');
const path = require('path');

async function packageApp() {
  try {
    const portalsDir = path.join(__dirname, '../portals');
    const playgroundDist = path.join(__dirname, '../packages/playground/dist');

    console.log('🧹 Cleaning Portals directory...');
    await fs.remove(portalsDir);
    await fs.ensureDir(portalsDir);

    console.log('📦 Copying playground build to Portals...');
    await fs.copy(playgroundDist, portalsDir);

    console.log('✅ App packaged successfully in Portals/');
    console.log('📁 Ready to deploy to Semoss Cloud');
  } catch (err) {
    console.error('❌ Error packaging app:', err);
    process.exit(1);
  }
}

packageApp();