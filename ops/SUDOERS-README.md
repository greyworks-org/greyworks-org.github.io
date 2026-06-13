# Greyworks Twin Service — Sudoers Rule
#
# The dobby user needs passwordless sudo to manage the twin service via systemd.
# The existing sudoers file /etc/sudoers.d/dobby does not include the greyworks-twin service.
# To install:
#
#   sudo cp /srv/dobby/repos/greyworks-redesign/ops/sudoers.dobby-greyworks-twin /etc/sudoers.d/dobby-greyworks-twin
#   sudo chmod 440 /etc/sudoers.d/dobby-greyworks-twin
#
# Then dobby can run:
#   systemctl start|stop|restart|status dobby-greyworks-twin
