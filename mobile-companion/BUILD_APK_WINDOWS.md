# Build Tanryugram APK from Windows

The earlier command failed because `C:\path\to\pulse-social\mobile-companion` was an example placeholder. After extracting this folder, use the actual folder location shown in File Explorer.

The Android package is already set to **`com.tanryugram`** and the EAS profile already outputs an APK.

## Recommended Windows method

1. Extract the supplied ZIP to a simple location such as `C:\Tanryugram`.
2. Open that folder in File Explorer, click the address bar, type `powershell`, and press Enter. PowerShell will open in the correct folder automatically.
3. Run exactly:

```powershell
npm install
npx eas-cli build --platform android --profile production
```

If PowerShell says that EAS needs authentication, run:

```powershell
npx eas-cli login
```

Finish the browser login, return to PowerShell, and rerun:

```powershell
npx eas-cli build --platform android --profile production
```

EAS will ask whether it may create or reuse Android signing credentials. Choose the automatic option. It will then display a build page and a download URL for the APK. The APK package name is **`com.tanryugram`**.

## Important

Do not type `C:\path\to\pulse-social\mobile-companion`; that text is not a real folder. Opening PowerShell from the extracted folder, as described above, avoids all path errors.

After downloading the APK, copy it to an Android phone, open it, enable installation from that source if Android asks, and install it. The app opens the live Tanryugram platform at `https://pulsesocil-ya4mwil9.manus.space`.
