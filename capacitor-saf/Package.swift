// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "Saf",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "Saf",
            targets: ["SafPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "8.0.0")
    ],
    targets: [
        .target(
            name: "SafPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm")
            ],
            path: "ios/Sources/SafPlugin"),
        .testTarget(
            name: "SafPluginTests",
            dependencies: ["SafPlugin"],
            path: "ios/Tests/SafPluginTests")
    ]
)