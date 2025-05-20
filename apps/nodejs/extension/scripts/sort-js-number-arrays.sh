#!/bin/bash
# This file exists because Firefox compare the content of the build submitted with the one they create locally, and the runtime.js
# have array of numbers but the numbers are not always in the same order, causing differences between the builds.

FILE="$1"

if [ -z "$FILE" ]; then
  echo "Usage: $0 <file.js>"
  exit 1
fi

# Create a temporary file
temp_file=$(mktemp)

# First, copy the file to preserve its contents
cp "$FILE" "$temp_file"

perl -i -pe '
  BEGIN { binmode STDIN, ":utf8"; binmode STDOUT, ":utf8"; }
  # Match arrays of numbers that appear after a string index, preserving structure
  s{
    (\["[^"]+",\[)        # Match ["any string",[
    (
      (?:
        \s*
        -?\d+(?:\.\d+)?(?:e[+-]?\d+)?  # match number (int, float, or scientific)
        \s*,?\s*
      )+
    )
    (?=\])                # Lookahead for closing bracket
  }{
    my $prefix = $1;
    my $numbers = $2;
    $numbers =~ s/\s+//g;
    $numbers =~ s/,\s*$//;
    my @nums = split /,/, $numbers;
    @nums = sort { $a <=> $b } @nums;
    $prefix . join(",", @nums);
  }egx;
' "$temp_file"

# Check if the temporary file is not empty before replacing
if [ -s "$temp_file" ]; then
    mv "$temp_file" "$FILE"
    echo "✅ Sorted number arrays in $FILE"
else
    echo "❌ Error: Processing resulted in empty file, original file preserved"
    rm "$temp_file"
    exit 1
fi
