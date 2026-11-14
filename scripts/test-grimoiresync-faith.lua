-- Faith integration smoke under Lua 5.1 with fake WoW UI; no game, combat automation or network.
local widgets, messages={},{}
local now, inInstance, dead=100, false, false
UIParent={}
local function widget(kind,name)
  local w={kind=kind,name=name,visible=true,scripts={}}
  local noOp={"SetWidth","SetHeight","SetPoint","SetFrameStrata","SetMovable","EnableMouse","RegisterForDrag","SetAllPoints","SetTexture","SetVertexColor","SetJustifyH","SetJustifyV","SetAutoFocus","SetMaxLetters","SetFocus","ClearFocus","HighlightText","SetFrameLevel","RegisterForClicks","SetTextColor"}
  for _,method in ipairs(noOp) do w[method]=function()end end
  function w:CreateTexture() return widget("Texture") end
  function w:CreateFontString() return widget("FontString") end
  function w:SetScript(event,fn) self.scripts[event]=fn end
  function w:RegisterEvent(event) self.events=self.events or {};self.events[event]=true end
  function w:Show() self.visible=true end
  function w:Hide() self.visible=false end
  function w:IsShown() return self.visible end
  function w:SetText(s) self.text=s end
  function w:GetText() return self.text or "" end
  function w:GetFrameLevel()return 1 end
  function w:StartMoving()end
  function w:StopMovingOrSizing()end
  if name then widgets[name]=w end
  return w
end
function CreateFrame(kind,name) return widget(kind,name) end
SlashCmdList={}
DEFAULT_CHAT_FRAME={AddMessage=function(_,s)messages[#messages+1]=s end}
function GetTime()return now end
function IsInInstance()return inInstance end
function UnitIsDeadOrGhost()return dead end
function UnitLevel()return 34 end
function UnitXP()return 2000 end
function UnitXPMax()return 4000 end
function UnitClass()return "Druide" end
function GetRealZoneText()return "Les Tarides" end
local function has(part)
 for _,s in ipairs(messages)do if string.find(s,part,1,true)then return true end end
 return false
end
assert(loadfile("public/binch/addon/GrimoireSync/Faith.lua"))()
local event=assert(widgets.GrimoireFaithEvents).scripts.OnEvent
event(nil,"PLAYER_LOGIN")
local launcher=assert(widgets.GrimoireFaithButton)
assert(not launcher:IsShown(),"Faith defaults to opt-in and hidden launcher")
assert(type(SlashCmdList.GRIMOIREFAITH)=="function","slash command registered")
local cmd=SlashCmdList.GRIMOIREFAITH
cmd("statut")
assert(has("inactif"),"Faith is inactive at boot")
messages={}
event(nil,"PLAYER_DEAD")
assert(#messages==0,"no unsolicited chat before explicit opt-in")
cmd("on")
assert(GrimoireSyncDB.faithPrefs.enabled and launcher:IsShown(),"opt-in shows launcher")
cmd("niveau")
assert(has("Niveau 34"),"local level answer")
cmd("xp")
assert(has("2000/4000"),"local XP answer")
cmd("mode sobre")
assert(GrimoireSyncDB.faithPrefs.mood=="sobre","mood persisted")
messages={}
now=150
event(nil,"PLAYER_LEVEL_UP")
assert(has("Niveau atteint"),"local progression after opting in")
local before=#messages
now=151
event(nil,"PLAYER_LEVEL_UP")
assert(#messages==before,"level notification throttled")
inInstance=true
messages={}
now=210
event(nil,"PLAYER_DEAD")
assert(#messages==0,"quiet in instance suppresses spontaneous death")
cmd("instance off")
messages={}
dead=false
event(nil,"PLAYER_ALIVE")
now=240
event(nil,"PLAYER_DEAD")
assert(has("La mort fait partie du chemin"),"instance override allows message")
cmd("mode silence")
messages={}
now=270
dead=false
event(nil,"PLAYER_ALIVE")
event(nil,"PLAYER_DEAD")
assert(#messages==0,"silent mode suppresses spontaneous chatter")
cmd("off")
assert(not launcher:IsShown(),"disable hides launcher")
assert(GrimoireSyncDB.faithPrefs.enabled==false,"disable persisted")
print("Faith Lua 5.1 API smoke: opt-in, slash, level, XP, throttle, instance, silence OK")
