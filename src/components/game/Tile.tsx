import React, { useState } from 'react';
import styled from 'styled-components';
import { Player, Tile as TileType, StructureType } from '../../types';

interface TileProps {
  tile: TileType;
  onClick: () => void;
  onBuild: (structureType: StructureType) => void;
  onDemolish: () => void;
  players: Player[];
  currentPlayerId: string | null;
}

interface TileContainerProps {
  ownerColor: string;
  isNeutral: boolean;
}

const TileContainer = styled.div<TileContainerProps>`
  position: relative;
  background-color: ${props => props.isNeutral ? '#222' : props.ownerColor};
  border: 1px solid #444;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  text-align: center;
  transition: all 0.2s;
  aspect-ratio: 1;
  
  &:hover {
    opacity: 0.8;
    transform: scale(1.03);
    z-index: 2;
  }
`;

const TileContent = styled.div`
  font-size: 1rem;
  color: white;
  text-shadow: 1px 1px 1px black;
`;

const StructureSymbol = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
`;

const TileValues = styled.div`
  position: absolute;
  bottom: 2px;
  right: 2px;
  font-size: 0.6rem;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(0, 0, 0, 0.4);
  padding: 1px 3px;
  border-radius: 2px;
`;

const TileMenu = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 5;
`;

const TileButton = styled.button`
  margin: 2px;
  padding: 4px 8px;
  background: #444;
  border: 1px solid #666;
  color: white;
  cursor: pointer;
  border-radius: 3px;
  font-size: 0.7rem;
  
  &:hover {
    background: #555;
  }
`;

const AnnexButton = styled(TileButton)`
  background: #b22222;
  
  &:hover {
    background: #d32f2f;
  }
`;

const Tile: React.FC<TileProps> = ({ tile, onClick, onBuild, onDemolish, players, currentPlayerId }) => {
  const [showMenu, setShowMenu] = useState(false);
  
  const { x, y, owner, structure, goldValue, unitValue } = tile;
  
  const ownerPlayer = owner !== null ? players.find(p => p.id === owner) : null;
  const ownerColor = ownerPlayer ? ownerPlayer.color : 'transparent';
  const isNeutral = owner === null;
  const isOwnTile = owner === currentPlayerId;
  const isEnemyTile = !isNeutral && !isOwnTile;
  
  // Calculate gold cost based on territory size
  const calculateGoldCost = (tile: TileType, players: Player[], currentPlayerId: string | null): number => {
    if (!currentPlayerId) return 0;
    const currentPlayer = players.find(p => p.id === currentPlayerId);
    if (!currentPlayer) return 0;
    
    // Base cost is 10 + 1 for every 3 tiles
    const territorySizeCost = Math.floor(currentPlayer.tiles.length / 3);
    return tile.owner === null ? (10 + territorySizeCost) : (20 + territorySizeCost);
  };

  const handleClick = () => {
    if (showMenu) {
      return; // Don't trigger main click when menu is open
    }
    
    if (isNeutral || isEnemyTile) {
      // For neutral or enemy tiles, show the annex option
      setShowMenu(true);
    } else if (isOwnTile) {
      // For own tiles, show the build/demolish options
      setShowMenu(true);
    }
  };
  
  const handleBuild = (structureType: StructureType) => {
    onBuild(structureType);
    setShowMenu(false);
  };
  
  const handleDemolish = () => {
    onDemolish();
    setShowMenu(false);
  };
  
  const handleAnnex = () => {
    if (tile.owner === null) {
      onClick();
      setShowMenu(false);
    } else if (tile.owner !== currentPlayerId) {
      onClick();
      setShowMenu(false);
    }
  };
  
  return (
    <TileContainer
      ownerColor={ownerColor}
      isNeutral={isNeutral}
      onClick={handleClick}
    >
      <TileContent>
        {structure && (
          <StructureSymbol>
            {structure.symbol}
          </StructureSymbol>
        )}
      </TileContent>
      
      {!isNeutral && (
        <TileValues>
          {goldValue}G/{unitValue}U
        </TileValues>
      )}
      
      {showMenu && (
        <TileMenu onClick={(e) => e.stopPropagation()}>
          {/* For neutral or enemy tiles */}
          {(isNeutral || isEnemyTile) && (
            <>
              {isNeutral && (
                <AnnexButton onClick={handleAnnex}>
                  Annex ({calculateGoldCost(tile, players, currentPlayerId)} G)
                </AnnexButton>
              )}
              {tile.owner !== currentPlayerId && tile.owner !== null && (
                <AnnexButton onClick={handleAnnex}>
                  Occupy ({calculateGoldCost(tile, players, currentPlayerId)} G, {tile.unitValue} U)
                </AnnexButton>
              )}
              <TileButton onClick={() => setShowMenu(false)}>
                Cancel
              </TileButton>
            </>
          )}
          
          {/* For own tiles without structure */}
          {isOwnTile && !structure && (
            <>
              <TileButton onClick={() => handleBuild('Gold')}>
                Build Gold (G)
              </TileButton>
              <TileButton onClick={() => handleBuild('Unit')}>
                Build Unit (U)
              </TileButton>
              <TileButton onClick={() => handleBuild('Defence')}>
                Build Defence (D)
              </TileButton>
              <TileButton onClick={() => setShowMenu(false)}>
                Cancel
              </TileButton>
            </>
          )}
          
          {/* For own tiles with structure */}
          {isOwnTile && structure && (
            <>
              <TileButton onClick={handleDemolish}>
                Demolish
              </TileButton>
              <TileButton onClick={() => setShowMenu(false)}>
                Cancel
              </TileButton>
            </>
          )}
        </TileMenu>
      )}
    </TileContainer>
  );
};

export default Tile; 