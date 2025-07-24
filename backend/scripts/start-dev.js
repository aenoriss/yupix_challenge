import { spawn } from 'child_process';
import { platform } from 'os';

const isWindows = platform() === 'win32';
const isMac = platform() === 'darwin';
const isLinux = platform() === 'linux';

function startMongoDB() {
  console.log('Starting MongoDB...');
  
  let mongoProcess;
  
  if (isWindows || isLinux) {
    mongoProcess = spawn('mongod', [], {
      stdio: 'inherit',
      shell: true
    });
  } else if (isMac) {
    mongoProcess = spawn('brew', ['services', 'start', 'mongodb-community'], {
      stdio: 'inherit'
    });
  }
  
  if (mongoProcess) {
    mongoProcess.on('error', (err) => {
      console.error('MongoDB start error:', err);
      console.log('\n⚠️  MongoDB is not installed or not in PATH.');
      console.log('Please install MongoDB or use MongoDB Atlas (cloud).');
      console.log('Starting server anyway...\n');
      startServer();
    });
    
    setTimeout(() => {
      console.log('MongoDB should be running now.');
      startServer();
    }, 2000);
  } else {
    startServer();
  }
}

function startServer() {
  console.log('Starting backend server...');
  const serverProcess = spawn('node', ['server.js'], {
    stdio: 'inherit',
    shell: true
  });
  
  serverProcess.on('error', (err) => {
    console.error('Server start error:', err);
    process.exit(1);
  });
  
  process.on('SIGINT', () => {
    console.log('\nShutting down...');
    if (isWindows || isLinux) {
      spawn('mongod', ['--shutdown'], { stdio: 'inherit', shell: true });
    } else if (isMac) {
      spawn('brew', ['services', 'stop', 'mongodb-community'], { stdio: 'inherit' });
    }
    process.exit(0);
  });
}

startMongoDB();