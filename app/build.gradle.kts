plugins {
    id("com.android.application")
}

android {
    namespace = "com.nottas.app"
    compileSdk = 36

    signingConfigs {
        create("stableDebug") {
            storeFile = rootProject.file("keystore/nottas-debug.keystore")
            storePassword = "nottasdebug"
            keyAlias = "nottasdebug"
            keyPassword = "nottasdebug"
        }
    }

    defaultConfig {
        applicationId = "com.nottas.app"
        minSdk = 26
        targetSdk = 36
        versionCode = 51
        versionName = "0.19.1"
    }

    buildTypes {
        debug {
            signingConfig = signingConfigs.getByName("stableDebug")
        }
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
