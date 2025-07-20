{
  config,
  lib,
  pkgs,
  ...
}:
let
  cfg = config.services.identity-crisis;
  identity-crisis-pkg = pkgs.callPackage ./default.nix { };

  # Taken from immich
  commonServiceConfig = {
    Type = "simple";

    # Hardening
    CapabilityBoundingSet = "";
    NoNewPrivileges = true;
    PrivateUsers = true;
    PrivateTmp = true;
    PrivateDevices = true;
    PrivateMounts = true;
    ProtectClock = true;
    ProtectControlGroups = true;
    ProtectHome = true;
    ProtectHostname = true;
    ProtectKernelLogs = true;
    ProtectKernelModules = true;
    ProtectKernelTunables = true;
    RestrictAddressFamilies = [
      "AF_INET"
      "AF_INET6"
      "AF_UNIX"
    ];
    RestrictNamespaces = true;
    RestrictRealtime = true;
    RestrictSUIDSGID = true;
  };
in
{
  options.services.identity-crisis = {
    enable = lib.mkEnableOption "identity-crisis";
    port = lib.mkOption {
      type = lib.types.int;
      default = 1821;
      description = "Port to listen on";
    };

    host = lib.mkOption {
      type = lib.types.str;
      default = "localhost";
    };

    origin = lib.mkOption {
      type = lib.types.nullOr lib.types.str;
      example = "https://my.site";
      default = null;
    };
    node-package = lib.mkPackageOption pkgs "node" { };
  };

  config.systemd.services.identity-crisis = lib.mkIf cfg.enable {
    description = "Countdown timer";
    after = [ "network.target" ];
    wantedBy = [ "multi-user.target" ];

    serviceConfig = commonServiceConfig // {
      ExecStart = ''
        # TODO: This can destroy the entire database!!! Not a good long term plan.
        ${identity-crisis-pkg}/node_modules/drizzle-kit/bin.cjs push --force
        ${pkgs.nodejs}/bin/node ${identity-crisis-pkg}/build
      '';
      StateDirectory = "identity-crisis";
      SyslogIdentifier = "identity-crisis";
      RuntimeDirectory = "identity-crisis";
    };

    environment = {
      "PORT" = "${toString cfg.port}";
      "HOST" = cfg.host;
      "ORIGIN" = lib.mkIf (cfg.origin != null) cfg.origin;
    };
  };
}
