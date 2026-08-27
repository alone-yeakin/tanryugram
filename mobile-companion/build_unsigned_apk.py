import os
import subprocess
import sys

print("=== Tanryugram Unsigned APK Build Script ===")
print("Generating native Android project using Expo prebuild / CLI...")

os.environ["ANDROID_HOME"] = "/home/ubuntu/android-sdk"
os.chdir("/home/ubuntu/tanryugram/mobile-companion")

# Install dependencies if needed
if not os.path.exists("node_modules"):
    print("Installing node modules...")
    subprocess.run(["npm", "install"], check=True)

# Run expo prebuild to generate android native project
print("Running expo prebuild...")
res = subprocess.run(["npx", "expo", "prebuild", "--platform", "android", "--clean"], capture_output=True, text=True)
print(res.stdout)
if res.returncode != 0:
    print("Prebuild stderr:", res.stderr)
    sys.exit(res.returncode)

# Check android directory
if os.path.exists("android"):
    print("Android directory generated successfully.")
    os.chdir("android")
    print("Building debug APK with Gradle...")
    build_res = subprocess.run(["./gradlew", "assembleDebug"], capture_output=True, text=True)
    print(build_res.stdout)
    if build_res.returncode != 0:
        print("Gradle build stderr:", build_res.stderr)
        sys.exit(build_res.returncode)
    
    apk_path = "app/build/outputs/apk/debug/app-debug.apk"
    if os.path.exists(apk_path):
        dest = "/home/ubuntu/tanryugram-debug.apk"
        subprocess.run(["cp", apk_path, dest], check=True)
        print(f"SUCCESS: Debug APK successfully copied to {dest}")
    else:
        print("Error: APK output file not found after gradle build.")
        sys.exit(1)
else:
    print("Error: android folder was not generated.")
    sys.exit(1)
