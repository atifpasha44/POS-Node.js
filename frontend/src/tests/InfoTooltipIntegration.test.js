import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

// Import all components that should have InfoTooltip integration
import ItemMaster from '../src/ItemMaster';
import TaxStructure from '../src/TaxStructure';
import UnitOfMeasurement from '../src/UnitOfMeasurement';
import UserSetup from '../src/UserSetup';
import PropertyCode from '../src/PropertyCode';
import ReasonCodes from '../src/ReasonCodes';
import TaxCodes from '../src/TaxCodes';
import CreditCardManager from '../src/CreditCardManager';
import OutletSetup from '../src/OutletSetup';
import UserGroups from '../src/UserGroups';
import ItemCategories from '../src/ItemCategories';
import ItemDepartments from '../src/ItemDepartments';

// Test data for localStorage
const mockUserData = {
  "userSetupEnabled": true,
  "itemMasterEnabled": true,
  "taxStructureEnabled": true,
  "unitOfMeasurementEnabled": true,
  "propertyCodeEnabled": true,
  "reasonCodesEnabled": true,
  "taxCodesEnabled": true,
  "creditCardManagerEnabled": true,
  "outletSetupEnabled": true,
  "userGroupsEnabled": true,
  "itemCategoriesEnabled": true,
  "itemDepartmentsEnabled": true
};

// Component wrapper for testing
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('InfoTooltip Integration Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Set up Software Control to enabled state
    localStorage.setItem('softwareControlData', JSON.stringify(mockUserData));
  });

  afterEach(() => {
    localStorage.clear();
  });

  const testInfoTooltipIntegration = (ComponentName, componentTitle, expectedMainTable, expectedLinkedTables = []) => {
    test(`${componentTitle} - InfoTooltip integration`, async () => {
      render(
        <TestWrapper>
          <ComponentName />
        </TestWrapper>
      );

      // Check that form title exists
      const titleElement = screen.getByText(componentTitle);
      expect(titleElement).toBeInTheDocument();

      // Check that InfoTooltip icon is visible (ℹ️)
      const infoIcon = screen.getByText('ℹ️');
      expect(infoIcon).toBeInTheDocument();
      expect(infoIcon).toBeVisible();

      // Click the InfoTooltip icon
      fireEvent.click(infoIcon);

      // Wait for modal to appear
      await waitFor(() => {
        const modal = screen.getByText('Database Information');
        expect(modal).toBeInTheDocument();
      });

      // Check Main Table section
      expect(screen.getByText('Main Table')).toBeInTheDocument();
      expect(screen.getByText(expectedMainTable)).toBeInTheDocument();

      // Check Linked Tables section if expected
      if (expectedLinkedTables.length > 0) {
        expect(screen.getByText('Linked Tables')).toBeInTheDocument();
        expectedLinkedTables.forEach(linkedTable => {
          expect(screen.getByText(linkedTable)).toBeInTheDocument();
        });
      } else {
        expect(screen.getByText('No linked tables')).toBeInTheDocument();
      }

      // Close modal by clicking X button
      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);

      // Wait for modal to disappear
      await waitFor(() => {
        expect(screen.queryByText('Database Information')).not.toBeInTheDocument();
      });
    });
  };

  // Test InfoTooltip integration for all forms
  describe('Core Forms', () => {
    testInfoTooltipIntegration(
      ItemMaster, 
      'Item Master', 
      'it_conf_item_master',
      ['it_conf_item_categories', 'it_conf_item_departments', 'it_conf_taxstructure', 'it_conf_uom']
    );

    testInfoTooltipIntegration(
      TaxStructure, 
      'Tax Structure', 
      'it_conf_taxstructure'
    );

    testInfoTooltipIntegration(
      UnitOfMeasurement, 
      'Unit of Measurement', 
      'it_conf_uom'
    );

    testInfoTooltipIntegration(
      UserSetup, 
      'User Setup', 
      'it_conf_user_setup',
      ['it_conf_user_groups']
    );
  });

  describe('Configuration Forms', () => {
    testInfoTooltipIntegration(
      PropertyCode, 
      'Property Code', 
      'it_conf_property'
    );

    testInfoTooltipIntegration(
      ReasonCodes, 
      'Reason Codes', 
      'it_conf_reasons'
    );

    testInfoTooltipIntegration(
      TaxCodes, 
      'Tax Codes', 
      'it_conf_taxcode'
    );

    testInfoTooltipIntegration(
      CreditCardManager, 
      'Credit Card Manager', 
      'it_conf_ccm'
    );

    testInfoTooltipIntegration(
      OutletSetup, 
      'Outlet Setup', 
      'it_conf_outset',
      ['it_conf_outses', 'it_conf_outordtyp']
    );

    testInfoTooltipIntegration(
      UserGroups, 
      'User Groups', 
      'it_conf_user_groups',
      ['it_conf_roles']
    );

    testInfoTooltipIntegration(
      ItemCategories, 
      'Item Categories', 
      'it_conf_item_categories'
    );

    testInfoTooltipIntegration(
      ItemDepartments, 
      'Item Departments', 
      'it_conf_item_departments'
    );
  });

  describe('InfoTooltip Visibility Tests', () => {
    test('InfoTooltip should not appear when Software Control is disabled', () => {
      // Disable all Software Control settings
      const disabledSettings = Object.keys(mockUserData).reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {});
      
      localStorage.setItem('softwareControlData', JSON.stringify(disabledSettings));

      render(
        <TestWrapper>
          <PropertyCode />
        </TestWrapper>
      );

      // Check that form title exists
      const titleElement = screen.getByText('Property Code');
      expect(titleElement).toBeInTheDocument();

      // Check that InfoTooltip icon is NOT visible
      expect(screen.queryByText('ℹ️')).not.toBeInTheDocument();
    });

    test('InfoTooltip should appear when Software Control is enabled', () => {
      render(
        <TestWrapper>
          <PropertyCode />
        </TestWrapper>
      );

      // Check that form title exists
      const titleElement = screen.getByText('Property Code');
      expect(titleElement).toBeInTheDocument();

      // Check that InfoTooltip icon IS visible
      expect(screen.getByText('ℹ️')).toBeInTheDocument();
    });
  });

  describe('Modal Functionality Tests', () => {
    test('Modal opens and closes correctly', async () => {
      render(
        <TestWrapper>
          <ItemMaster />
        </TestWrapper>
      );

      // Click InfoTooltip icon
      const infoIcon = screen.getByText('ℹ️');
      fireEvent.click(infoIcon);

      // Wait for modal to appear
      await waitFor(() => {
        expect(screen.getByText('Database Information')).toBeInTheDocument();
      });

      // Modal should have overlay
      const overlay = document.querySelector('.infotooltip-overlay');
      expect(overlay).toBeInTheDocument();

      // Close modal by clicking overlay
      fireEvent.click(overlay);

      // Wait for modal to disappear
      await waitFor(() => {
        expect(screen.queryByText('Database Information')).not.toBeInTheDocument();
      });
    });

    test('Modal displays correct table information', async () => {
      render(
        <TestWrapper>
          <OutletSetup />
        </TestWrapper>
      );

      // Click InfoTooltip icon
      const infoIcon = screen.getByText('ℹ️');
      fireEvent.click(infoIcon);

      // Wait for modal to appear
      await waitFor(() => {
        expect(screen.getByText('Database Information')).toBeInTheDocument();
      });

      // Check specific content for OutletSetup
      expect(screen.getByText('Main Table')).toBeInTheDocument();
      expect(screen.getByText('it_conf_outset')).toBeInTheDocument();
      expect(screen.getByText('Linked Tables')).toBeInTheDocument();
      expect(screen.getByText('it_conf_outses')).toBeInTheDocument();
      expect(screen.getByText('it_conf_outordtyp')).toBeInTheDocument();
    });
  });

  describe('Integration Consistency Tests', () => {
    test('All forms should have consistent InfoTooltip styling', () => {
      const forms = [
        { Component: PropertyCode, title: 'Property Code' },
        { Component: ReasonCodes, title: 'Reason Codes' },
        { Component: TaxCodes, title: 'Tax Codes' },
        { Component: ItemCategories, title: 'Item Categories' },
      ];

      forms.forEach(({ Component, title }) => {
        const { unmount } = render(
          <TestWrapper>
            <Component />
          </TestWrapper>
        );

        // Check InfoTooltip icon exists and has correct styling
        const infoIcon = screen.getByText('ℹ️');
        expect(infoIcon).toBeInTheDocument();
        
        // Check icon has correct CSS classes/styling
        const iconElement = infoIcon.closest('span');
        expect(iconElement).toHaveStyle({
          marginLeft: '10px',
          cursor: 'pointer',
          fontSize: '1.2rem'
        });

        unmount();
      });
    });
  });
});

// Performance test for InfoTooltip rendering
describe('InfoTooltip Performance Tests', () => {
  test('InfoTooltip should render quickly', () => {
    const startTime = performance.now();
    
    render(
      <TestWrapper>
        <PropertyCode />
      </TestWrapper>
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render in less than 100ms
    expect(renderTime).toBeLessThan(100);
  });

  test('Modal should open quickly', async () => {
    render(
      <TestWrapper>
        <PropertyCode />
      </TestWrapper>
    );

    const infoIcon = screen.getByText('ℹ️');
    
    const startTime = performance.now();
    fireEvent.click(infoIcon);
    
    await waitFor(() => {
      expect(screen.getByText('Database Information')).toBeInTheDocument();
    });
    
    const endTime = performance.now();
    const openTime = endTime - startTime;

    // Modal should open in less than 50ms
    expect(openTime).toBeLessThan(50);
  });
});

export default describe;