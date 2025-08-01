# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an EnOcean CLI tool built with OCLIF for managing EnOcean dongles and listening to EnOcean telegrams. EnOcean is a wireless communication protocol commonly used in home automation and building automation systems.

## Development Commands

- **Build**: `npm run build` - Compiles TypeScript to JavaScript in the `dist/` directory
- **Test**: `npm run test` - Runs Mocha tests followed by linting
- **Lint**: `npm run lint` - Runs ESLint with the configured rules
- **Format**: `npm run format` - Formats code using Prettier

## Architecture

### Core Components

- **Base Command** (`src/base.command.ts`): Abstract base class for all CLI commands that provides cache initialization and error handling
- **Commands** (`src/commands/`): OCLIF command implementations organized by topic (e.g., `dongle/configure`, `dongle/listen`)
- **Libraries** (`src/libraries/`): Framework-agnostic business logic:
  - `enocean/`: Core EnOcean protocol implementation
    - `manager.ts`: Main EnOcean communication manager with event handling
    - `parser.ts`: ESP3 packet parsing logic
    - `profiles.ts`: EEP (EnOcean Equipment Profile) decoder
    - `types.ts`: TypeScript definitions for EnOcean protocol structures
- **Shared** (`src/shared/`): External system adapters:
  - `storage/file-storage.ts`: File system operations implementation

### Key Architectural Patterns

- **Clean Architecture**: Clear separation between CLI layer, core business logic, and infrastructure
- **Event-driven**: The `EnOceanManager` extends `EventEmitter` to handle telegram reception
- **OCLIF Framework**: Commands follow OCLIF conventions with static descriptions and examples
- **Dependency Inversion**: Core logic depends on abstractions, not concrete implementations
- **Framework Agnostic Libraries**: Business logic can be used in any context (CLI, web, desktop, etc.)
- **TypeScript**: Fully typed codebase with strict type checking

### Library Usage (Non-CLI)

The core functionality can be used independently of the CLI:

```typescript
import { EnOceanManager } from 'enocean';

// Use in any application context
const manager = new EnOceanManager();
manager.on('eepData', (data) => {
  console.log('Received data:', data);
});

await manager.connect('/dev/ttyUSB0', { baudRate: 57600 });
```

### Data Flow

1. User configures dongle via `dongle configure` command (stores port/baud in cache using SerialPort.list())
2. `dongle listen` command reads configuration and initializes `EnOceanManager`
3. Manager connects directly to serial port using SerialPort and listens for ESP3 packets
4. Incoming data is parsed and decoded using EEP profiles
5. Decoded telegrams are emitted as events and logged to console

## Important Notes

- **Framework Separation**: Core EnOcean logic is completely independent of OCLIF CLI framework
- **Direct SerialPort Usage**: Uses SerialPort directly for communication
- **Storage Abstraction**: File operations are abstracted through shared layer
- **Supports TCM 310 USB dongles** with 57,600 baud default
- **Cache files** are stored in OCLIF's cache directory (CLI-specific concern)
- **Commands require dongle** to be configured before use
- **French comments and console output** (intentional for target users)
