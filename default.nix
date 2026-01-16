{
  nodejs,
  pnpm_10,
  bash,
  stdenv,
  pnpmConfigHook,
  fetchPnpmDeps,
  lib,
  databaseUrl ? "file:./main.db",
}:
stdenv.mkDerivation (finalAttrs: rec {
  pname = "identity-crisis";
  version = "0.1.0";

  src = lib.cleanSource ./.;

  nativeBuildInputs = [
    nodejs
    (pnpmConfigHook.override { pnpm = pnpm_10; })
    pnpm_10
  ];

  pnpmDeps = fetchPnpmDeps {
    inherit (finalAttrs) pname version src;
    pnpm = pnpm_10;
    fetcherVersion = 2;
    hash = "sha256-b679BZ2qnBw/IBOrBLh1XvVMqm/Ev8b8tah7K1Snfu4=";
  };

  installPhase = ''
    runHook preInstall

    # idk why database url is needed while building...
    export DATABASE_URL=${databaseUrl}

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
    export DATABASE_URL=${databaseUrl}
    ${nodejs}/bin/node $out/build
    " > $out/bin/${pname}

    chmod ugo+x $out/bin/${pname}

    runHook postInstall
  '';
})
