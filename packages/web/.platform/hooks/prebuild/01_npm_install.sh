#!/bin/bash
  #!/bin/bash
  set -e

  echo "Starting npm install with legacy peer deps..." | tee /tmp/eb-prebuild.log
  npm install --legacy-peer-deps --production=false 2>&1 | tee -a /tmp/eb-prebuild.log

  echo "Running postinstall (next build)..." | tee -a /tmp/eb-prebuild.log
  npm run postinstall 2>&1 | tee -a /tmp/eb-prebuild.log

  echo "npm install and build completed successfully" | tee -a /tmp/eb-prebuild.log