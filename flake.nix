{
  description = "Question game";

  inputs = {
    flake-parts.url = "github:hercules-ci/flake-parts";
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs =
    inputs@{ flake-parts, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "aarch64-darwin"
        "x86_64-darwin"
      ];

      flake = {
        nixosModules.default = import ./module.nix;
      };

      perSystem =
        {
          pkgs,
          ...
        }:
        {
          packages.default = pkgs.callPackage ./default.nix;
          devShells.default = pkgs.mkShell {
            packages = [
              pkgs.pnpm
              pkgs.nodejs

              pkgs.svelte-language-server
              pkgs.typescript-language-server
              pkgs.superhtml
              pkgs.vscode-langservers-extracted
              pkgs.tailwindcss-language-server
            ];

            shellHook = ''
              pnpm install
            '';
          };
        };
      flake = {
        # The usual flake attributes can be defined here, including system-
        # agnostic ones like nixosModule and system-enumerating ones, although
        # those are more easily expressed in perSystem.

      };
    };
}
