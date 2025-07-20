const { exec } = require('child_process');

function cleanupDockerResources() {
  console.log('🧹 Cleaning up Docker resources...');
  
  // Remove all code-runner containers and images
  exec('docker ps -a --filter "name=code-runner" -q | xargs -r docker rm', (err) => {
    if (err) console.log('No containers to remove');
  });
  
  exec('docker images --filter "reference=code-runner-*" -q | xargs -r docker rmi', (err) => {
    if (err) console.log('No images to remove');
  });
  
  // Clean up dangling images
  exec('docker image prune -f', (err) => {
    if (err) console.log('Image prune failed');
    else console.log('✅ Docker cleanup completed');
  });
}

cleanupDockerResources();