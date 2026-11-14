-- Synthetic WoW API contract test. No WoW client, account files or network.
-- Run at repository root: lua5.1 scripts/test-grimoiresync-mock.lua
local frames = {}
function CreateFrame()
  local frame = {}
  function frame:RegisterEvent(event) self.registered = self.registered or {}; self.registered[event] = true end
  function frame:SetScript(kind, fn) self[kind] = fn end
  frames[#frames+1] = frame
  return frame
end
SLASH_GRIMOIRESYNC1 = nil
SlashCmdList = {}
function UnitFullName() return "Golipette-QA", "Forever" end
function UnitName() return "Golipette-QA" end
function GetRealmName() return "Forever" end
function UnitLevel() return 34 end
function UnitClass() return "Druide","DRUID" end
function UnitRace() return "Tauren","Tauren" end
function UnitFactionGroup() return "Horde" end
function GetRealZoneText() return "Les Tarides" end
function GetMoney() return 12745 end
function UnitXP() return 2000 end
function UnitXPMax() return 4000 end
function GetXPExhaustion() return 500 end
function GetBuildInfo() return "ForeverMock","0","synthetic",16001 end
function time() return 1700000000 end
function GetNumContainerSlots() return 0 end
function GetContainerNumSlots() return 0 end
function GetQuestsCompleted() return {[79976] = true} end
function GetNumQuestLogEntries() return 1 end
function GetQuestLogTitle() return "Stepping Stones",34,nil,nil,false,false,false,nil,79192 end
function GetNumSkillLines() return 1 end
function GetSkillLineInfo() return "Minage",false,nil,180,nil,nil,225 end
function GetInventoryItemLink() return nil end
-- Keep standard output reserved for one machine-readable payload.
function print(...) io.stderr:write(table.concat({...}," "), "\n") end
assert(loadfile("public/binch/addon/GrimoireSync/Core.lua"))()
assert(type(frames[1])=="table" and type(frames[1].OnEvent)=="function","addon event handler registered")
assert(frames[1].registered.PLAYER_LOGIN and frames[1].registered.PLAYER_LOGOUT,"login/logout registered")
frames[1].OnEvent(frames[1],"PLAYER_LOGIN")
assert(type(GrimoireSyncDB)=="table" and GrimoireSyncDB.schema==6,"GF6 stored")
assert(GrimoireSyncDB.lastCharacter=="Golipette-QA-Forever","synthetic character")
assert(GrimoireSyncDB.payload:sub(1,4)=="GF6|","GF6 exported")
assert(GrimoireSyncDB.payload:find("Stepping Stones",1,true),"quest title serialized")
assert(GrimoireSyncDB.payload:find("79976",1,true),"completed quest in export")
assert(GrimoireSyncDB.payload:find("Minage,180,225",1,true),"profession in export")
io.write(GrimoireSyncDB.payload, "\n")
