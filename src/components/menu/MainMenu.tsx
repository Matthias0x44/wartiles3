import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const MenuContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #1a1a1a;
  background-image: linear-gradient(135deg, #1a1a1a 0%, #333 100%);
  color: white;
`;

const GameTitle = styled.h1`
  font-size: 4rem;
  margin-bottom: 2rem;
  text-align: center;
  color: #fff;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3), 0 0 20px rgba(255, 255, 255, 0.2);
  animation: glow 2s infinite alternate;
  
  @keyframes glow {
    from {
      text-shadow: 0 0 10px rgba(255, 255, 255, 0.3), 0 0 20px rgba(255, 255, 255, 0.2);
    }
    to {
      text-shadow: 0 0 15px rgba(255, 255, 255, 0.5), 0 0 30px rgba(255, 255, 255, 0.3);
    }
  }
`;

const MenuButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 280px;
`;

const MenuButton = styled.button`
  padding: 1rem 2rem;
  font-size: 1.2rem;
  font-weight: bold;
  text-transform: uppercase;
  background-color: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  }
`;

const Footer = styled.div`
  position: absolute;
  bottom: 20px;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
`;

const MainMenu: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <MenuContainer>
      <GameTitle>Wartiles Online</GameTitle>
      
      <MenuButtons>
        <MenuButton onClick={() => navigate('/multiplayer')}>
          Multiplayer
        </MenuButton>
        
        <MenuButton onClick={() => navigate('/solo')}>
          Solo Play
        </MenuButton>
        
        <MenuButton onClick={() => navigate('/info')}>
          Game Info
        </MenuButton>
      </MenuButtons>
      
      <Footer>
        © 2023 Wartiles Online
      </Footer>
    </MenuContainer>
  );
};

export default MainMenu; 