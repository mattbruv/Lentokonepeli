#!/usr/bin/env python3
import shutil
import subprocess
import os

def get_latest_commit():
    """Gets the latest Git commit hash (short version)."""
    return subprocess.check_output(["git", "rev-parse", "--short", "HEAD"]).decode().strip()


def build_lento():
    try:
        # Delete TS ./bindings folder if exists so types area never stale
        if os.path.exists('./bindings'):
            shutil.rmtree('./bindings')
        
        env = os.environ.copy()
        env["COMMIT"] = get_latest_commit()
        print(env["COMMIT"])

        # Run cargo build
        subprocess.run(['cargo', 'build'], env=env, check=True)

        # Run cargo test to generate TS types
        subprocess.run(['cargo', 'test'], env=env, check=True)

        # Change directory to ./dogfight-web
        os.chdir('./dogfight-web')

        # Run wasm-pack build to build client WASM file
        subprocess.run(['wasm-pack', 'build'], env=env, check=True)

    except subprocess.CalledProcessError as e:
        print(f"Error executing command: {e.cmd}")

if __name__ == "__main__":
    build_lento()