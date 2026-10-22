#!/bin/sh
set -eu

JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-11.jdk/Contents/Home
MAVEN_BIN=/xxx/path/to/apache-maven-xxx/bin/mvn
MAVEN_SETTINGS=/xxx/path/to/apache-maven-xxx/conf/settings.xml
MAVEN_REPO=/xxx/path/to/maven-work

export JAVA_HOME
PATH="$JAVA_HOME/bin:$PATH"
export PATH

for path in "$JAVA_HOME/bin/java" "$MAVEN_BIN" "$MAVEN_SETTINGS" "$MAVEN_REPO"; do
  if [ ! -e "$path" ]; then
    printf 'Maven toolchain path missing: %s\n' "$path" >&2
    exit 2
  fi
done

if [ ! -x "$MAVEN_BIN" ]; then
  printf 'Maven executable is not executable: %s\n' "$MAVEN_BIN" >&2
  exit 2
fi

if ! grep -Fq "<localRepository>$MAVEN_REPO</localRepository>" "$MAVEN_SETTINGS"; then
  printf 'Maven settings localRepository does not match the pinned repository.\n' >&2
  exit 2
fi

if ! grep -Fq '<activeProfile>nexus-private</activeProfile>' "$MAVEN_SETTINGS"; then
  printf 'Maven settings does not activate the pinned nexus-private profile.\n' >&2
  exit 2
fi

version_output=$("$MAVEN_BIN" -version)
printf '%s\n' "$version_output" | sed -n '1,4p'
printf '%s\n' "$version_output" | grep -Fq 'Apache Maven 3.8.6' || {
  printf 'Pinned Maven version check failed.\n' >&2
  exit 2
}
printf '%s\n' "$version_output" | grep -Fq 'Java version: 11.0.22' || {
  printf 'Pinned Java version check failed.\n' >&2
  exit 2
}

exec "$MAVEN_BIN" -o -s "$MAVEN_SETTINGS" -Dmaven.repo.local="$MAVEN_REPO" -P nexus-private "$@"
