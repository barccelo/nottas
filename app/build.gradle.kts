plugins {
    id("com.android.application")
}

android {
    namespace = "com.nottas.app"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.nottas.app"
        minSdk = 26
        targetSdk = 36
        versionCode = 138
        versionName = "0.27.57"
    }

    buildTypes {
        // Android Studio uses its local debug keystore. Never commit a signing key.
        debug {}
        // CI builds an unsigned release and signs it separately with GitHub Secrets.
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    implementation("com.google.firebase:firebase-messaging:26.0.0")
}
