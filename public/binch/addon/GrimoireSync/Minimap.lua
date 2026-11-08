-- GrimoireSync / La Binch — bouton discret de mini-carte (pas de panneau ni barre).
-- Charge par le TOC après Core.lua. Ne modifie aucune fonctionnalité WoW.
local boot = CreateFrame("Frame")
boot:RegisterEvent("PLAYER_LOGIN")
boot:SetScript("OnEvent", function(self, event)
  self:UnregisterEvent("PLAYER_LOGIN")
  if not Minimap or GrimoireSyncMinimapButton then return end

  local button = CreateFrame("Button", "GrimoireSyncMinimapButton", Minimap)
  button:SetWidth(30)
  button:SetHeight(30)
  button:SetFrameStrata("MEDIUM")
  button:SetFrameLevel((Minimap:GetFrameLevel() or 0) + 5)
  button:SetPoint("TOPLEFT", Minimap, "TOPLEFT", -11, 2)
  button:RegisterForClicks("LeftButtonUp", "RightButtonUp")

  local background = button:CreateTexture(nil, "BACKGROUND")
  background:SetAllPoints(button)
  background:SetTexture("Interface\\Minimap\\UI-Minimap-Background")
  background:SetVertexColor(0.1, 0.18, 0.14, 0.9)

  local icon = button:CreateTexture(nil, "ARTWORK")
  icon:SetPoint("CENTER", button, "CENTER", 0, 0)
  icon:SetWidth(19)
  icon:SetHeight(19)
  icon:SetTexture("Interface\\Icons\\INV_Misc_Book_09")
  button.icon = icon

  local ring = button:CreateTexture(nil, "OVERLAY")
  ring:SetAllPoints(button)
  ring:SetTexture("Interface\\Minimap\\MiniMap-TrackingBorder")

  local highlight = button:CreateTexture(nil, "HIGHLIGHT")
  highlight:SetAllPoints(button)
  highlight:SetTexture("Interface\\Minimap\\UI-Minimap-ZoomButton-Highlight")

  button:SetScript("OnEnter", function(self)
    if not GameTooltip then return end
    GameTooltip:SetOwner(self, "ANCHOR_LEFT")
    GameTooltip:AddLine("La Binch - GrimoireSync", 0.96, 0.78, 0.45)
    GameTooltip:AddLine("Clic gauche : /reload (sauvegarde les donnees du jeu)", 1, 1, 1)
    GameTooltip:AddLine("Puis : importer GrimoireSync.lua sur le site La Binch.", 0.8, 0.9, 0.8)
    GameTooltip:AddLine("Clic droit : aide de synchronisation.", 0.7, 0.8, 0.7)
    GameTooltip:Show()
  end)
  button:SetScript("OnLeave", function() if GameTooltip then GameTooltip:Hide() end end)
  button:SetScript("OnClick", function(self, mouse)
    if mouse == "LeftButton" then
      if type(ReloadUI) == "function" then
        ReloadUI()
      else
        print("|cffff7777La Binch|r : commande /reload indisponible sur ce client.")
      end
    else
      print("|cffd9b56cLa Binch|r : /reload enregistre tes donnees localement.")
      print("|cffd9b56cLa Binch|r : puis, sur le site, Synchronisation > Choisir GrimoireSync.lua.")
      print("|cffd9b56cLa Binch|r : le fichier est dans WTF/Account/<compte>/SavedVariables/.")
    end
  end)
end)
