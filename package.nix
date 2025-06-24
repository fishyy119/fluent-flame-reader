{
  buildNpmPackage,
  electron_34,
  fetchFromGitHub,
  makeWrapper,
  ...
}:
let
  electron = electron_34;

in

buildNpmPackage rec {
  pname = "fluent-reader";
  version = "1.1.4";
  src = fetchFromGitHub {
    owner = "yang991178";
    repo = "fluent-reader";
    rev = "v${version}";
    hash = "sha256-/VBXm6KiwJC/JTKp8m/dkmGmPZ2x2fHYiX9ylw8eDvY=";
  };

  npmDepsHash = "sha256-okonmZMhsftTtmg4vAK1n48IiG+cUG9AM5GI6wF0SnM=";

  nativeBuildInputs = [
    makeWrapper
    electron
  ];

  buildPhase = ''
    runHook preBuild

    npm run build
    npm exec electron-builder -- \
      --dir \
      -c.electronDist=${electron.dist} \
      -c.electronVersion=${electron.version}

    runHook postBuild
  '';


  installPhase = ''
    runHook preInstall

    makeWrapper '${electron}/bin/electron' "$out/bin/fluent-reader" \
      --add-flags "$out/share/appium-inspector/resources/app.asar" \
      --add-flags "\''${NIXOS_OZONE_WL:+\''${WAYLAND_DISPLAY:+--ozone-platform-hint=auto --enable-features=WaylandWindowDecorations --enable-wayland-ime=true}}" \
      --set NODE_ENV production

    runHook postInstall
  '';
}
