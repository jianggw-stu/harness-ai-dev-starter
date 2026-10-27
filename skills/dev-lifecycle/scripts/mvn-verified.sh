#!/bin/sh
set -eu

JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-11.jdk/Contents/Home
MAVEN_BIN=/path/to/apache-maven-xxx/bin/mvn
MAVEN_SETTINGS=/path/to/apache-maven-xxx/conf/settings.xml
MAVEN_REPO=/path/to/maven-work

export JAVA_HOME
PATH="$JAVA_HOME/bin:$PATH"
export PATH

# 固定参数放在命令前面仍可能被后续参数覆盖，因此先拒绝相冲突的入口。
expected_value=
expect_property=false
scope_option=
modules=
test_filter=
build_goal=false
test_goal=false
skip_tests=false
also_make=false
for argument in "$@"; do
  if [ -n "$scope_option" ]; then
    modules=$argument
    scope_option=
    continue
  fi
  if [ -n "$expected_value" ]; then
    if [ "$argument" != "$expected_value" ]; then
      printf 'Pinned Maven configuration override rejected.\n' >&2
      exit 2
    fi
    expected_value=
    continue
  fi
  if [ "$expect_property" = true ]; then
    argument="-D$argument"
    expect_property=false
  fi
  case "$argument" in --define=*) argument="-D${argument#--define=}" ;; esac
  case "$argument" in
    clean|clean:clean|*:maven-clean-plugin:*:clean)
      printf 'Incremental build rejected clean; retain the current worktree build outputs.\n' >&2
      exit 2 ;;
    -pl|--projects) scope_option=projects ;;
    -pl?*) modules=${argument#-pl} ;;
    --projects=*) modules=${argument#--projects=} ;;
    -am|--also-make|-amd|--also-make-dependents) also_make=true ;;
    -Dtest=*) test_filter=${argument#-Dtest=} ;;
    -DskipTests|-DskipTests=true|-Dmaven.test.skip=true) skip_tests=true ;;
    -DskipTests=false|-Dmaven.test.skip=false) skip_tests=false ;;
    compile|test-compile|test|package|verify|install|deploy|compiler:compile|surefire:test) build_goal=true ;;
  esac
  case "$argument" in test|package|verify|install|deploy|surefire:test) test_goal=true ;; esac
  case "$argument" in
    -s|--settings) expected_value=$MAVEN_SETTINGS ;;
    -P|--activate-profiles) expected_value=nexus-private ;;
    -P?*) [ "${argument#-P}" = nexus-private ] || { printf 'Pinned Maven profile override rejected.\n' >&2; exit 2; } ;;
    --activate-profiles=*) [ "${argument#--activate-profiles=}" = nexus-private ] || { printf 'Pinned Maven profile override rejected.\n' >&2; exit 2; } ;;
    -D|--define) expect_property=true ;;
    -s?*) [ "${argument#-s}" = "$MAVEN_SETTINGS" ] || { printf 'Pinned Maven settings override rejected.\n' >&2; exit 2; } ;;
    --settings=*) [ "${argument#--settings=}" = "$MAVEN_SETTINGS" ] || { printf 'Pinned Maven settings override rejected.\n' >&2; exit 2; } ;;
    -Dmaven.repo.local=*) [ "${argument#-Dmaven.repo.local=}" = "$MAVEN_REPO" ] || { printf 'Pinned Maven repository override rejected.\n' >&2; exit 2; } ;;
    -gs|--global-settings|-gs?*|--global-settings=*|-Djava.home=*|-Dmaven.home=*|-U|--update-snapshots)
      printf 'Pinned offline Maven toolchain override rejected.\n' >&2
      exit 2 ;;
  esac
done
if [ -n "$expected_value" ] || [ -n "$scope_option" ] || [ "$expect_property" = true ]; then
  printf 'Maven option value missing.\n' >&2
  exit 2
fi
if [ "$build_goal" = true ] && [ -z "$modules" ]; then
  printf 'Scoped build requires -pl <affected-module>; full-repository builds are not allowed.\n' >&2
  exit 2
fi
if [ "$test_goal" = true ] && [ "$skip_tests" = false ]; then
  case "$test_filter" in ''|'*'|'**/*')
    printf 'Focused tests require -Dtest=<specific-test-classes>.\n' >&2
    exit 2 ;;
  esac
  if [ "$also_make" = true ]; then
    printf 'Focused tests must not use -am/-amd; prepare only missing direct dependencies separately with tests skipped.\n' >&2
    exit 2
  fi
fi

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

exec "$MAVEN_BIN" -o -s "$MAVEN_SETTINGS" -Dmaven.repo.local="$MAVEN_REPO" -P nexus-private -Dmaven.compiler.useIncrementalCompilation=false "$@"
