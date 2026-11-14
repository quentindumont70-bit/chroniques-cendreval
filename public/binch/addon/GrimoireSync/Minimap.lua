-- GrimoireSync / La Binch - livre deplacable autour de la mini-carte.
-- L'API WoW ne donne pas le chemin Windows absolu ni l'acces au presse-papiers.
local boot=CreateFrame("Frame")
boot:RegisterEvent("PLAYER_LOGIN")
boot:SetScript("OnEvent",function(self)
  self:UnregisterEvent("PLAYER_LOGIN")
  if not Minimap or GrimoireSyncMinimapButton then return end
  local button=CreateFrame("Button","GrimoireSyncMinimapButton",Minimap)
  button:SetWidth(28)
  button:SetHeight(28)
  button:SetFrameStrata("MEDIUM")
  button:SetFrameLevel((Minimap:GetFrameLevel() or 0)+5)
  button:RegisterForClicks("LeftButtonUp","RightButtonUp")
  -- Position stored only inside WoW SavedVariables, never sent to the browser.
  -- Clamp both loaded coordinates and user drags to the minimap circumference.
  local function radius()
    local width=tonumber(Minimap:GetWidth()) or 140
    local height=tonumber(Minimap:GetHeight()) or 140
    return math.max(30,math.min(width,height)/2+10)
  end
  local function position(x,y)
    local r=radius()
    x=tonumber(x) or r*0.71
    y=tonumber(y) or r*0.71
    if x~=x or y~=y or math.abs(x)>10000 or math.abs(y)>10000 then
      x,y=r*0.71,r*0.71
    end
    local length=math.sqrt(x*x+y*y)
    if length<1 then x,y=r*0.71,r*0.71
    else x,y=x*r/length,y*r/length end
    button:ClearAllPoints()
    button:SetPoint("CENTER",Minimap,"CENTER",x,y)
    return x,y
  end
  local db=type(GrimoireSyncDB)=="table" and GrimoireSyncDB or {}
  local stored=type(db.minimapPosition)=="table" and db.minimapPosition or {}
  position(stored.x,stored.y)
  -- Recovery if other minimap addons obscure the book. Callable from /grimoire minimap reset.
  GrimoireSyncResetMinimap=function()
    GrimoireSyncDB=type(GrimoireSyncDB)=="table" and GrimoireSyncDB or {}
    GrimoireSyncDB.minimapPosition=nil
    position(nil,nil)
    return true
  end
  button:SetMovable(true)
  button:EnableMouse(true)
  button:RegisterForDrag("LeftButton")
  -- Some WoW clients also dispatch OnClick when a drag ends. Never reload then.
  local dragStopTime=nil
  button:SetScript("OnDragStart",function(self)
    self:StartMoving()
  end)
  button:SetScript("OnDragStop",function(self)
    dragStopTime=type(GetTime)=="function" and GetTime() or nil
    self:StopMovingOrSizing()
    local x,y=self:GetCenter()
    local mx,my=Minimap:GetCenter()
    if not x or not y or not mx or not my then return end
    local px,py=position(x-mx,y-my)
    GrimoireSyncDB=type(GrimoireSyncDB)=="table" and GrimoireSyncDB or {}
    GrimoireSyncDB.minimapPosition={x=px,y=py}
  end)

  local background=button:CreateTexture(nil,"BACKGROUND")
  background:SetAllPoints(button)
  background:SetTexture("Interface\\Minimap\\UI-Minimap-Background")
  background:SetVertexColor(0.1,0.18,0.14,0.9)
  local icon=button:CreateTexture(nil,"ARTWORK")
  icon:SetPoint("CENTER",button,"CENTER",0,0)
  icon:SetWidth(19)
  icon:SetHeight(19)
  icon:SetTexture("Interface\\Icons\\INV_Misc_Book_09")
  local ring=button:CreateTexture(nil,"OVERLAY")
  ring:SetAllPoints(button)
  ring:SetTexture("Interface\\Minimap\\MiniMap-TrackingBorder")
  local highlight=button:CreateTexture(nil,"HIGHLIGHT")
  highlight:SetAllPoints(button)
  highlight:SetTexture("Interface\\Minimap\\UI-Minimap-ZoomButton-Highlight")

  local dialog=CreateFrame("Frame","GrimoireSyncPathDialog",UIParent)
  dialog:SetWidth(520)
  dialog:SetHeight(150)
  dialog:SetPoint("CENTER",UIParent,"CENTER",0,90)
  dialog:SetFrameStrata("DIALOG")
  -- Frame:SetBackdrop n'existe pas sur certains builds Forever.
  -- Une texture de fond standard suffit et ne depend pas de BackdropTemplate.
  local dialogBG=dialog:CreateTexture(nil,"BACKGROUND")
  dialogBG:SetAllPoints(dialog)
  dialogBG:SetTexture("Interface\\DialogFrame\\UI-DialogBox-Background")
  dialog:EnableMouse(true)
  dialog:Hide()
  local title=dialog:CreateFontString(nil,"OVERLAY","GameFontNormal")
  title:SetPoint("TOP",dialog,"TOP",0,-19)
  title:SetText("La Binch - chemin de sauvegarde")
  local subtitle=dialog:CreateFontString(nil,"OVERLAY","GameFontHighlightSmall")
  subtitle:SetPoint("TOP",title,"BOTTOM",0,-8)
  subtitle:SetText("Ctrl+C pour copier le chemin relatif; complete le nom de compte.")
  local edit=CreateFrame("EditBox",nil,dialog,"InputBoxTemplate")
  edit:SetWidth(460)
  edit:SetHeight(25)
  edit:SetPoint("TOP",subtitle,"BOTTOM",0,-14)
  edit:SetAutoFocus(false)
  edit:SetText("WTF\\Account\\NOM_DU_COMPTE\\SavedVariables\\GrimoireSync.lua")
  edit:SetScript("OnEscapePressed",function(self)self:ClearFocus();dialog:Hide()end)
  local close=CreateFrame("Button",nil,dialog,"UIPanelButtonTemplate")
  close:SetWidth(95)
  close:SetHeight(23)
  close:SetPoint("BOTTOM",dialog,"BOTTOM",0,15)
  close:SetText("Fermer")
  close:SetScript("OnClick",function()edit:ClearFocus();dialog:Hide()end)

  button:SetScript("OnEnter",function(self)
    if not GameTooltip then return end
    GameTooltip:SetOwner(self,"ANCHOR_LEFT")
    GameTooltip:AddLine("La Binch - GrimoireSync",0.96,0.78,0.45)
    GameTooltip:AddLine("Clic gauche : /reload (sauvegarder)",1,1,1)
    GameTooltip:AddLine("Clic droit : afficher un chemin copiable (Ctrl+C)",0.8,0.9,0.8)
    GameTooltip:AddLine("Glisser : deplacer le livre autour de la mini-carte",0.8,0.9,0.8)
    GameTooltip:Show()
  end)
  button:SetScript("OnLeave",function()if GameTooltip then GameTooltip:Hide()end end)
  button:SetScript("OnClick",function(self,mouse)
    if mouse=="LeftButton" then
      if dragStopTime and type(GetTime)=="function" then
        local elapsed=GetTime()-dragStopTime
        dragStopTime=nil
        if elapsed>=0 and elapsed<0.35 then return end
      end
      if type(ReloadUI)=="function" then ReloadUI()
      else print("|cffff7777La Binch|r : /reload indisponible sur ce client.") end
    else
      dialog:Show()
      edit:SetFocus()
      edit:HighlightText()
      print("|cffd9b56cLa Binch|r : Ctrl+C pour copier le chemin relatif. WoW ne connait pas ton chemin disque absolu.")
    end
  end)
end)
