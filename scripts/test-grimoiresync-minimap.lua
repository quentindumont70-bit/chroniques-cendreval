-- GrimoireSync minimap UI and /reload integration in a synthetic WoW API.
local widgets,allWidgets={},{}
local function widget(name)
  local w={shown=true,scripts={}}
  for _,k in ipairs({"SetWidth","SetHeight","SetPoint","SetFrameStrata","SetFrameLevel","RegisterForClicks","SetAllPoints","SetTexture","SetVertexColor","SetText","EnableMouse","SetAutoFocus","SetFocus","ClearFocus","HighlightText"}) do w[k]=function()end end
  function w:GetFrameLevel()return 1 end
  function w:Hide()self.shown=false end
  function w:Show()self.shown=true end
  function w:IsShown()return self.shown end
  function w:CreateTexture()return widget()end
  function w:CreateFontString()return widget()end
  function w:SetScript(k,f)self.scripts[k]=f end
  function w:RegisterEvent(k)self.registered=k end
  function w:UnregisterEvent(k)self.unregistered=k end
  allWidgets[#allWidgets+1]=w
  if name then widgets[name]=w end
  return w
end
function CreateFrame(_,name)return widget(name)end
Minimap=widget("Minimap")
UIParent=widget("UIParent")
local reloads=0
function ReloadUI()reloads=reloads+1 end
function print()end
local tooltips={}
GameTooltip={
 SetOwner=function()end,AddLine=function(_,line)tooltips[#tooltips+1]=line end,
 Show=function()end,Hide=function()end
}
assert(loadfile("public/binch/addon/GrimoireSync/Minimap.lua"))()
local boot
for _,w in ipairs(allWidgets)do if w.registered=="PLAYER_LOGIN" then boot=w;break end end
assert(boot and boot.scripts.OnEvent,"minimap boot registered")
boot.scripts.OnEvent(boot,"PLAYER_LOGIN")
assert(boot.unregistered=="PLAYER_LOGIN","one-time boot unregistered")
local button=assert(widgets.GrimoireSyncMinimapButton,"button created")
local dialog=assert(widgets.GrimoireSyncPathDialog,"path dialog created")
assert(not dialog:IsShown(),"dialog hidden by default")
button.scripts.OnClick(button,"LeftButton")
assert(reloads==1,"left click issues /reload once")
button.scripts.OnClick(button,"RightButton")
assert(dialog:IsShown(),"right click reveals relative SavedVariables path")
button.scripts.OnEnter(button)
local hasPath,hasReload=false,false
for _,t in ipairs(tooltips)do
 if t:find("chemin",1,true)then hasPath=true end
 if t:find("/reload",1,true)then hasReload=true end
end
assert(hasPath and hasReload,"minimap tooltip accurately describes functions")
print("GrimoireSync minimap Lua 5.1 smoke: reload, path, tooltip, one-time boot OK")
