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
    dataDir = lib.mkOption {
      type = lib.types.path;
      default = "/var/lib/identity-crisis";
      description = "Main directory to store data";
    };

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

    user = lib.mkOption {
      type = lib.types.str;
      default = "identity-crisis";
      description = "User account under which idnetity-crisis runs.";
    };

    group = lib.mkOption {
      type = lib.types.str;
      default = "identity-crisis";
      description = "Group under which identity-crisis runs.";
    };
  };

  config = {
    systemd.services.identity-crisis = lib.mkIf cfg.enable {
      description = "Countdown timer";
      after = [ "network.target" ];
      wantedBy = [ "multi-user.target" ];

      serviceConfig = commonServiceConfig // {
        User = cfg.user;
        Group = cfg.group;
        WorkingDirectory = cfg.dataDir;

        ExecStart = "${pkgs.nodejs}/bin/node ${identity-crisis-pkg}/build";
        StateDirectory = "identity-crisis";
        SyslogIdentifier = "identity-crisis";
        RuntimeDirectory = "identity-crisis";

        ReadWritePaths = [
          cfg.dataDir
        ];
      };

      environment = {
        "PORT" = "${toString cfg.port}";
        "HOST" = cfg.host;
        "ORIGIN" = lib.mkIf (cfg.origin != null) cfg.origin;
        "DATABASE_URL" = "file:${cfg.dataDir}/main.db";
      };
    };

    # From forgejo
    systemd.tmpfiles.rules = [
      "d '${cfg.dataDir}' 0750 ${cfg.user} ${cfg.group} - -"
    ];

    # From forgejo
    users = {
      users = lib.mkIf (cfg.user == "identity-crisis") {
        identity-crisis = {
          home = cfg.dataDir;
          useDefaultShell = true;
          group = cfg.group;
          isSystemUser = true;
        };
      };

      groups = lib.mkIf (cfg.group == "identity-crisis") {
        identity-crisis = { };
      };
    };
  };
}
