#!/usr/bin/env python3
import shutil
import subprocess
import os

def build_lento():
    try:
        # Delete TS ./bindings folder if exists so types area never stale
        if os.path.exists('./bindings'):
            shutil.rmtree('./bindings')

        # Run cargo build
        subprocess.run(['cargo', 'build'], check=True)

        # Run cargo test to generate TS types
        subprocess.run(['cargo', 'test'], check=True)

        # Change directory to ./dogfight-web
        os.chdir('./dogfight-web')

        # Run wasm-pack build to build client WASM file
        subprocess.run(['wasm-pack', 'build'], check=True)

    except subprocess.CalledProcessError as e:
        print(f"Error executing command: {e.cmd}")

if __name__ == "__main__":
    build_lento()