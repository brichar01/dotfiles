/^#/  { printf "\033[38;5;65m%s\033[0m\n", $0; next }
/^$/  { print ""; next }
{
  n = index($0, "#")
  cmd = (n ? substr($0, 1, n-1) : $0)
  com = (n ? substr($0, n) : "")
  gsub(/--?[a-zA-Z][a-zA-Z0-9-]*/, "\033[38;5;179m&\033[38;5;252m", cmd)
  gsub(/"[^"]*"/, "\033[38;5;108m&\033[38;5;252m", cmd)
  printf "\033[38;5;252m%s\033[0m", cmd
  if (com != "") printf "\033[38;5;65m%s\033[0m", com
  printf "\n"
}
