-- Runs inside the user's Neovim, called by hive-buf through --remote-expr.
-- Content passes through temp files so every byte survives, line endings included.

---@param cmd "read"|"write"
---@param path string absolute path
---@param tmp string temp file: the content to write, or where to put what was read
---@return string result "ok", "disk" when `read` finds no buffer, or "error: <message>"
return function(cmd, path, tmp)
  local loaded, fs = pcall(require, "hive.fs")
  if not loaded then
    return "error: hive.nvim is not loaded in this Neovim"
  end

  local ok, result = pcall(function()
    if cmd == "read" then
      local content = fs.read(path)
      if content == nil then
        return "disk"
      end
      local f = assert(io.open(tmp, "wb"))
      f:write(content)
      f:close()
      return "ok"
    end

    local f = assert(io.open(tmp, "rb"))
    local content = f:read("a")
    f:close()
    fs.write(path, content)
    return "ok"
  end)
  return ok and result or ("error: " .. tostring(result))
end
