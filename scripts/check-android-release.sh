#!/usr/bin/env bash
# Disposable emulator only. Run as a single shell so variables and fail-fast persist.
set -euo pipefail
(cd android && ./gradlew :app:assembleReleaseAndroidTest -PtestBuildType=release --no-daemon)
(cd _stable && npm ci && SETKA_CHANNEL=stable npm run build && npx cap sync android)
chmod +x _stable/android/gradlew
(cd _stable/android && SETKA_CHANNEL=stable ./gradlew :app:assembleReleaseAndroidTest -PtestBuildType=release --no-daemon)
curl --fail -L https://github.com/FedotovskiiLev/Setka/releases/download/v0.3.2/Setka-0.3.2.apk -o /tmp/setka-stable.apk
echo '9d02c8e6b3e346f2dd2d3a07389ceff32c755f96361a9da55226b458f21970f9  /tmp/setka-stable.apk' | sha256sum --check
adb install /tmp/setka-stable.apk
adb install _stable/android/app/build/outputs/apk/androidTest/release/app-release-androidTest.apk
adb shell am instrument -w -e class 'io.setka.app.SetkaInstrumentedTest#seedPreviousStable' io.setka.app.release.test/androidx.test.runner.AndroidJUnitRunner | tee /tmp/setka-upgrade-seed.txt
grep -F 'OK (1 test)' /tmp/setka-upgrade-seed.txt
if [ "$SETKA_CHANNEL" = stable ]; then
  package_id=io.setka.app.release
  adb install -r android/app/build/outputs/apk/release/app-release.apk
  adb install -r android/app/build/outputs/apk/androidTest/release/app-release-androidTest.apk
  adb shell am instrument -w -e class 'io.setka.app.SetkaInstrumentedTest#previousStableDataSurvives' io.setka.app.release.test/androidx.test.runner.AndroidJUnitRunner | tee /tmp/setka-upgrade.txt
  grep -F 'OK (1 test)' /tmp/setka-upgrade.txt
else
  package_id="io.setka.app.$SETKA_CHANNEL"
  adb install android/app/build/outputs/apk/release/app-release.apk
  adb install android/app/build/outputs/apk/androidTest/release/app-release-androidTest.apk
  adb shell pm path io.setka.app.release
  adb shell pm path "$package_id"
  adb shell am instrument -w -e class 'io.setka.app.SetkaInstrumentedTest#nonstableStartsIsolated' "$package_id.test/androidx.test.runner.AndroidJUnitRunner" | tee /tmp/setka-isolation.txt
  grep -F 'OK (1 test)' /tmp/setka-isolation.txt
fi
test_runner="$package_id.test/androidx.test.runner.AndroidJUnitRunner"
adb shell am instrument -w -e class 'io.setka.app.SetkaInstrumentedTest#systemBarsAndMobileLayouts' "$test_runner" | tee /tmp/setka-layout.txt
grep -F 'OK (1 test)' /tmp/setka-layout.txt
adb shell am instrument -w -e class 'io.setka.app.SetkaInstrumentedTest#nativeTimePickerCommitsOnlyAfterFormSubmit' "$test_runner" | tee /tmp/setka-time-picker.txt
grep -F 'OK (1 test)' /tmp/setka-time-picker.txt
adb shell am instrument -w -e class 'io.setka.app.SetkaInstrumentedTest#localImportPlanningPersistenceAndBackgroundNotification' "$test_runner" | tee /tmp/setka-native.txt
grep -F 'OK (1 test)' /tmp/setka-native.txt
adb pull "/sdcard/Android/data/$package_id/files/qa" /tmp/setka-screens
adb install -r android/app/build/outputs/apk/release/app-release.apk
adb shell am instrument -w -e class 'io.setka.app.SetkaInstrumentedTest#retainedDataAfterReinstall' "$test_runner" | tee /tmp/setka-reinstall.txt
grep -F 'OK (1 test)' /tmp/setka-reinstall.txt
adb shell am instrument -w -e class 'io.setka.app.SetkaInstrumentedTest#previousStableDataSurvives' io.setka.app.release.test/androidx.test.runner.AndroidJUnitRunner | tee /tmp/setka-upgrade.txt
grep -F 'OK (1 test)' /tmp/setka-upgrade.txt
adb shell am instrument -w -e class 'io.setka.app.SetkaInstrumentedTest#studyRecoveryAndStatusLifecycle' "$test_runner" | tee /tmp/setka-study-status.txt
grep -F 'OK (1 test)' /tmp/setka-study-status.txt
adb reboot
adb wait-for-device
adb shell 'while [ "$(getprop sys.boot_completed)" != "1" ]; do sleep 1; done'
adb shell input keyevent 82
node scripts/check-status-reboot.mjs
