-- GrimoireSync minimap UI and /reload integration in a synthetic WoW API.
local widgets,allWidgets={},{}
local function widget(name)
  local w={shown=true,scripts={},width=140,height=140,cx=0,cy=0}
  for _,k in ipairs({"SetWidth","SetHeight","SetPoint","SetFrameStrata","SetFrameLevel","RegisterForClicks","SetAllPoints","SetTexture","SetVertexColor","SetText","EnableMouse","SetAutoFocus","SetFocus","ClearFocus","HighlightText"}) do w[k]=function()end end
  function w:GetFrameLevel()return 1 end
  function w:GetWidth()return self.width end
  function w:GetHeight()return self.height end
  function w:GetCenter()return self.cx,self.cy end
  function w:SetMovable(v)self.movable=v end
  function w:RegisterForDrag(v)self.dragButton=v end
  function w:StartMoving()self.moving=true end
  function w:StopMovingOrSizing()self.moving=false end
  function w:ClearAllPoints()self.points={}end
  function w:SetPoint(_,relative,_,x,y)
    self.points={x=x,y=y}
    if relative and relative.GetCenter then
      local rx,ry=relative:GetCenter()
      self.cx=(rx or 0)+(x or 0)
      self.cy=(ry or 0)+(y or 0)
    end
  end
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
assert(button.movable and button.dragButton=="LeftButton","drag enabled only on left button")
assert(button.scripts.OnDragStart and button.scripts.OnDragStop,"drag handlers present")
button.scripts.OnDragStart(button)
assert(button.moving,"drag starts moving")
button.cx=999
button.cy=0
button.scripts.OnDragStop(button)
assert(not button.moving,"drag finished")
assert(type(GrimoireSyncDB.minimapPosition)=="table","position persisted")
assert(math.abs(GrimoireSyncDB.minimapPosition.x-80)<0.01 and math.abs(GrimoireSyncDB.minimapPosition.y)<0.01,"position clamped to minimap edge")
assert(math.abs(button.cx-80)<0.01,"button snapped back to minimap ring")
button.scripts.OnDragStart(button)
button.cx=0
button.cy=-80
button.scripts.OnDragStop(button)
assert(math.abs(GrimoireSyncDB.minimapPosition.y+80)<0.01,"new position replaces former one")
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
assert(GrimoireSyncDB.minimapPosition.y<0,"saved position survives other clicks")
-- A fresh login must restore the saved spot without resetting it.
widgets.GrimoireSyncMinimapButton=nil
assert(loadfile("public/binch/addon/GrimoireSync/Minimap.lua"))()
local fresh=allWidgets[#allWidgets]
-- Last frame is the new event frame until PLAYER_LOGIN is fired.
assert(fresh.registered=="PLAYER_LOGIN","fresh boot registered")
fresh.scripts.OnEvent(fresh,"PLAYER_LOGIN")
local restored=assert(widgets.GrimoireSyncMinimapButton,"restored button")
assert(math.abs(restored.points.y+80)<0.01,"stored position restored on login")
print("GrimoireSync minimap Lua 5.1 smoke: reload, path, tooltip, drag, persistence OK")
