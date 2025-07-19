{
  nodejs,
  pnpm_10,
  bash,
  stdenv,
  lib,
}:
stdenv.mkDerivation (finalAttrs: rec {
  pname = "identity-crisis";
  version = "0.1.0";

  src = lib.cleanSource ./.;

  nativeBuildInputs = [
    nodejs
    pnpm_10.configHook
  ];

  pnpmDeps = pnpm_10.fetchDeps {
    inherit (finalAttrs) pname version src;
    hash = "sha256-MT0l4mACcsCEultFO+wxnGWQK+hfLVoQZcD/CVELXXw=";
  };

  installPhase = ''
    runHook preInstall

    mkdir -p $out

    pnpm run build
    cp -r build $out/build

    pnpm prune --prod
    # Clean up broken symlinks left behind by `pnpm prune`
    # https://github.com/pnpm/pnpm/issues/3645
    find node_modules -xtype l -delete

    cp -r node_modules package.json $out/

    mkdir -p $out/bin
    echo "\
    #!${bash}/bin/bash 
    ${nodejs}/bin/node $out/build
    " > $out/bin/${pname}

    chmod ugo+x $out/bin/${pname}

    runHook postInstall
  '';
})
