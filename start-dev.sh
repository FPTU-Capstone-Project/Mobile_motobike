#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  SEP491 - Development Startup  ${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to kill processes on specific ports
kill_port() {
    local port=$1
    print_status "Checking port $port..."
    
    if command_exists lsof; then
        local pid=$(lsof -ti:$port)
        if [ ! -z "$pid" ]; then
            print_warning "Killing process on port $port (PID: $pid)"
            kill -9 $pid 2>/dev/null
        fi
    elif command_exists netstat; then
        local pid=$(netstat -ano | findstr :$port | awk '{print $5}' | head -1)
        if [ ! -z "$pid" ]; then
            print_warning "Killing process on port $port (PID: $pid)"
            taskkill //PID $pid //F 2>/dev/null
        fi
    fi
}

# Function to start backend
start_backend() {
    print_status "Starting Backend Server..."
    
    # Check if backend directory exists
    if [ -d "backend" ]; then
        cd backend
        
        # Check if package.json exists
        if [ -f "package.json" ]; then
            print_status "Installing backend dependencies..."
            npm install
            
            print_status "Starting backend on port 3000..."
            npm start &
            BACKEND_PID=$!
            
            # Wait a bit for backend to start
            sleep 3
            print_status "Backend started with PID: $BACKEND_PID"
        else
            print_warning "Backend package.json not found. Skipping backend startup."
        fi
        
        cd ..
    else
        print_warning "Backend directory not found. Skipping backend startup."
    fi
}

# Function to start Expo
start_expo() {
    print_status "Starting Expo Development Server..."
    
    # Check if package.json exists
    if [ -f "package.json" ]; then
        print_status "Installing frontend dependencies..."
        npm install
        
        print_status "Starting Expo on port 8081..."
        npx expo start --clear &
        EXPO_PID=$!
        
        # Wait a bit for Expo to start
        sleep 5
        print_status "Expo started with PID: $EXPO_PID"
    else
        print_error "Frontend package.json not found!"
        exit 1
    fi
}

# Function to open development URLs
open_urls() {
    print_status "Opening development URLs..."
    
    # Try to open URLs in default browser
    if command_exists start; then
        # Windows
        start "http://localhost:3000" 2>/dev/null
        start "http://localhost:8081" 2>/dev/null
    elif command_exists open; then
        # macOS
        open "http://localhost:3000" 2>/dev/null
        open "http://localhost:8081" 2>/dev/null
    elif command_exists xdg-open; then
        # Linux
        xdg-open "http://localhost:3000" 2>/dev/null
        xdg-open "http://localhost:8081" 2>/dev/null
    fi
}

# Function to cleanup on exit
cleanup() {
    print_status "Shutting down services..."
    
    if [ ! -z "$BACKEND_PID" ]; then
        print_status "Stopping backend (PID: $BACKEND_PID)"
        kill $BACKEND_PID 2>/dev/null
    fi
    
    if [ ! -z "$EXPO_PID" ]; then
        print_status "Stopping Expo (PID: $EXPO_PID)"
        kill $EXPO_PID 2>/dev/null
    fi
    
    # Kill any remaining processes on our ports
    kill_port 3000
    kill_port 8081
    kill_port 19000
    kill_port 19001
    kill_port 19002
    
    print_status "Cleanup completed. Goodbye!"
    exit 0
}

# Function to show menu
show_menu() {
    echo ""
    print_header
    echo "1) Start Full Stack (Backend + Frontend)"
    echo "2) Start Backend Only"
    echo "3) Start Frontend Only (Expo)"
    echo "4) Kill All Development Servers"
    echo "5) Install Dependencies"
    echo "6) Clear Cache & Restart"
    echo "7) Exit"
    echo ""
    echo -n "Choose an option [1-7]: "
}

# Function to install dependencies
install_deps() {
    print_status "Installing all dependencies..."
    
    # Install frontend dependencies
    if [ -f "package.json" ]; then
        print_status "Installing frontend dependencies..."
        npm install
    fi
    
    # Install backend dependencies
    if [ -d "backend" ] && [ -f "backend/package.json" ]; then
        print_status "Installing backend dependencies..."
        cd backend
        npm install
        cd ..
    fi
    
    print_status "Dependencies installation completed!"
}

# Function to clear cache
clear_cache() {
    print_status "Clearing all caches..."
    
    # Clear npm cache
    npm cache clean --force
    
    # Clear Expo cache
    if command_exists expo; then
        expo r -c
    fi
    
    # Clear node_modules and reinstall
    if [ -d "node_modules" ]; then
        print_status "Removing node_modules..."
        rm -rf node_modules
    fi
    
    if [ -d "backend/node_modules" ]; then
        print_status "Removing backend node_modules..."
        rm -rf backend/node_modules
    fi
    
    install_deps
    print_status "Cache cleared and dependencies reinstalled!"
}

# Function to kill all dev servers
kill_all() {
    print_status "Killing all development servers..."
    
    # Kill common development ports
    kill_port 3000  # Backend
    kill_port 8081  # Expo Metro
    kill_port 19000 # Expo DevTools
    kill_port 19001 # Expo Tunnel
    kill_port 19002 # Expo LAN
    
    # Kill any node processes
    if command_exists pkill; then
        pkill -f "expo" 2>/dev/null
        pkill -f "metro" 2>/dev/null
        pkill -f "node.*3000" 2>/dev/null
    fi
    
    print_status "All development servers stopped!"
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check prerequisites
print_header
print_status "Checking prerequisites..."

if ! command_exists node; then
    print_error "Node.js is not installed! Please install Node.js first."
    exit 1
fi

if ! command_exists npm; then
    print_error "npm is not installed! Please install npm first."
    exit 1
fi

print_status "Node.js version: $(node --version)"
print_status "npm version: $(npm --version)"

if command_exists expo; then
    print_status "Expo CLI version: $(expo --version)"
else
    print_warning "Expo CLI not found. Installing..."
    npm install -g @expo/cli
fi

# Main execution
if [ "$1" = "--auto" ] || [ "$1" = "-a" ]; then
    # Auto mode - start everything
    print_status "Auto mode: Starting full stack..."
    kill_port 3000
    kill_port 8081
    start_backend
    start_expo
    open_urls
    
    print_status "Development servers are running!"
    print_status "Backend: http://localhost:3000"
    print_status "Frontend: http://localhost:8081"
    print_status "Press Ctrl+C to stop all servers"
    
    # Wait for user interrupt
    while true; do
        sleep 1
    done
else
    # Interactive mode
    while true; do
        show_menu
        read choice
        
        case $choice in
            1)
                kill_port 3000
                kill_port 8081
                start_backend
                start_expo
                open_urls
                print_status "Full stack started! Press Ctrl+C to stop all servers"
                while true; do sleep 1; done
                ;;
            2)
                kill_port 3000
                start_backend
                print_status "Backend started! Press Ctrl+C to stop"
                while true; do sleep 1; done
                ;;
            3)
                kill_port 8081
                start_expo
                print_status "Expo started! Press Ctrl+C to stop"
                while true; do sleep 1; done
                ;;
            4)
                kill_all
                ;;
            5)
                install_deps
                ;;
            6)
                clear_cache
                ;;
            7)
                print_status "Goodbye!"
                exit 0
                ;;
            *)
                print_error "Invalid option. Please choose 1-7."
                ;;
        esac
    done
fi
