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
- **Connectors** (`src/connectors/`): Abstraction layer for external systems:
  - `cache.connector.ts`: Manages persistent configuration storage
  - `dongle.connector.ts`: Low-level serial port communication wrapper
  - `storage.connector.ts`: File system operations abstraction
- **Libraries** (`src/libraries/enocean/`): Core EnOcean protocol implementation:
  - `manager.ts`: Main EnOcean communication manager with event handling
  - `parser.ts`: ESP3 packet parsing logic
  - `profiles.ts`: EEP (EnOcean Equipment Profile) decoder
  - `types.ts`: TypeScript definitions for EnOcean protocol structures

### Key Architectural Patterns

- **Event-driven**: The `EnOceanManager` extends `EventEmitter` to handle telegram reception
- **OCLIF Framework**: Commands follow OCLIF conventions with static descriptions and examples
- **Cache-based Configuration**: Dongle settings are persisted using the cache connector
- **TypeScript**: Fully typed codebase with strict type checking

### Data Flow

1. User configures dongle via `dongle configure` command (stores port/baud in cache)
2. `dongle listen` command reads configuration and initializes `EnOceanManager`
3. Manager connects to serial port and listens for ESP3 packets
4. Incoming data is parsed and decoded using EEP profiles
5. Decoded telegrams are emitted as events and logged to console

## Important Notes

- Uses SerialPort library for USB dongle communication
- Supports TCM 310 USB dongles with 57,600 baud default
- Cache files are stored in OCLIF's cache directory
- Commands require dongle to be configured before use
- French comments and console output (this is intentional for the target users)