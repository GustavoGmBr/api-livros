import { useState, useCallback, useEffect } from 'react';
import api from '../../../services/api';

export const useGerenciarInventario = (overrideHistoryId = null) => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [historicoId, setHistoricoId] = useState(overrideHistoryId);
  const [error, setError] = useState(null);

  // Carregar inventário - CORRIGIDO
  const loadInventory = useCallback(async (id) => {
    if (!id) {
      setInventory([]);
      setLoading(false);
      return [];
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`📦 Carregando inventário para historicoId: ${id}`);
      
      // ✅ Usar /inventarios com parâmetro historicoId
      const response = await api.get('/inventarios', { 
        params: { historicoId: id } 
      });
      
      console.log('📦 Resposta do servidor:', response.data);
      
      // Garantir que data seja um array
      const items = Array.isArray(response.data) ? response.data : [];
      console.log(`✅ Inventário carregado: ${items.length} itens`);
      
      setInventory(items);
      return items;
    } catch (error) {
      console.error('❌ Erro ao carregar inventário:', error);
      
      // Se for 404, significa que a rota não existe
      if (error.response?.status === 404) {
        console.error('🔴 Rota /inventarios não encontrada! Verifique:');
        console.error('  1. Se o backend está rodando');
        console.error('  2. Se a rota está registrada corretamente');
        console.error('  3. Se o prefixo /api está sendo usado');
        setError('Rota de inventário não encontrada. Verifique o backend.');
      }
      
      // Se for 500, erro no servidor
      if (error.response?.status === 500) {
        setError('Erro interno no servidor ao carregar inventário');
      }
      
      setInventory([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar quando historicoId mudar
  useEffect(() => {
    if (overrideHistoryId) {
      setHistoricoId(overrideHistoryId);
      loadInventory(overrideHistoryId);
    }
  }, [overrideHistoryId, loadInventory]);

  // Handlers
  const handleItemClick = useCallback((item) => {
    setSelectedItem(prev => prev?.id === item?.id ? null : item);
  }, []);

  const isSelected = useCallback((item) => {
    return selectedItem?.id === item?.id;
  }, [selectedItem]);

  const getQuantityDisplay = useCallback((qty) => {
    return Math.round(qty || 0);
  }, []);

  // Salvar/Atualizar item
  const handleSave = useCallback(async (itemData, isQuickAction = false) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const config = token ? { headers: { 'Authorization': `Bearer ${token}` } } : {};

      // 🔥 Remover campos undefined
      const cleanData = {
        nome: itemData.nome,
        tipo: itemData.tipo,
        quantidade: Number(itemData.quantidade) || 0,
        subtipo: itemData.subtipo || '',
        descricao: itemData.descricao || '',
        historico_id: Number(historicoId)
      };

      // Validar dados obrigatórios
      if (!cleanData.nome || !cleanData.tipo) {
        alert('Nome e Tipo são obrigatórios!');
        return null;
      }

      if (!cleanData.historico_id) {
        alert('Histórico ID é obrigatório!');
        return null;
      }

      console.log('💾 Salvando item:', cleanData);

      let response;
      if (itemData.id) {
        // ✅ PUT /private/inventarios/:id
        response = await api.put(`/private/inventarios/${itemData.id}`, cleanData, config);
      } else {
        // ✅ POST /private/inventarios
        response = await api.post('/private/inventarios', cleanData, config);
      }

      const data = response.data;
      console.log('✅ Item salvo:', data);
      
      // Atualizar lista local
      setInventory(prev => {
        if (itemData.id) {
          return prev.map(item => item.id === data.id ? data : item);
        } else {
          return [...prev, data];
        }
      });
      
      if (!itemData.id) {
        setSelectedItem(data);
      }
      
      return data;
    } catch (error) {
      console.error('❌ Erro ao salvar item:', error);
      
      const errorMsg = error.response?.data?.error || 
                       error.response?.data?.message || 
                       'Erro ao salvar item. Verifique os dados e tente novamente.';
      alert(errorMsg);
      throw error;
    }
  }, [historicoId]);

  // Atualizar dinheiro
  const handleUpdateDinheiro = useCallback(async (itemId, operacao, valor) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const config = token ? { headers: { 'Authorization': `Bearer ${token}` } } : {};

      console.log(`💰 Atualizando dinheiro: item=${itemId}, operacao=${operacao}, valor=${valor}`);

      // ✅ PATCH /private/inventarios/:id/dinheiro
      const { data } = await api.patch(
        `/private/inventarios/${itemId}/dinheiro`,
        { operacao, valor: Number(valor) },
        config
      );

      console.log('✅ Dinheiro atualizado:', data);

      setInventory(prev => prev.map(item => item.id === data.id ? data : item));
      return data;
    } catch (error) {
      console.error('❌ Erro ao atualizar dinheiro:', error);
      alert(error.response?.data?.error || 'Erro ao atualizar valor');
      throw error;
    }
  }, []);

  // Deletar item
  const handleDeleteItem = useCallback(async (itemId) => {
    if (!window.confirm('Deseja remover este item do inventário?')) return;
    
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const config = token ? { headers: { 'Authorization': `Bearer ${token}` } } : {};

      console.log(`🗑️ Deletando item: ${itemId}`);

      // ✅ DELETE /private/inventarios/:id
      await api.delete(`/private/inventarios/${itemId}`, config);
      
      console.log('✅ Item deletado');
      
      setInventory(prev => prev.filter(item => item.id !== itemId));
      if (selectedItem?.id === itemId) setSelectedItem(null);
      return true;
    } catch (error) {
      console.error('❌ Erro ao deletar item:', error);
      alert(error.response?.data?.error || 'Erro ao deletar item');
      return false;
    }
  }, [selectedItem]);

  // Deletar inventário inteiro
  const deleteInventory = useCallback(async (historyId) => {
    if (!window.confirm('⚠️ ATENÇÃO: Isso irá excluir TODOS os itens deste inventário. Esta ação é irreversível. Deseja continuar?')) {
      return false;
    }
    
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const config = token ? { headers: { 'Authorization': `Bearer ${token}` } } : {};

      // Buscar todos os itens do histórico
      const items = await loadInventory(historyId);
      
      if (items && items.length > 0) {
        // Deletar cada item individualmente
        for (const item of items) {
          await api.delete(`/private/inventarios/${item.id}`, config);
        }
        setInventory([]);
        setSelectedItem(null);
        console.log('✅ Inventário deletado completamente');
        return true;
      } else {
        alert('Nenhum item encontrado para excluir.');
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao deletar inventário:', error);
      alert(error.response?.data?.error || 'Erro ao deletar inventário');
      return false;
    }
  }, [loadInventory]);

  // Ação do botão flutuante
  const handleAction = useCallback(() => {
    if (selectedItem) {
      return selectedItem;
    } else {
      return null;
    }
  }, [selectedItem]);

  // Buscar item específico
  const fetchItem = useCallback(async (itemId) => {
    try {
      console.log(`🔍 Buscando item: ${itemId}`);
      // ✅ GET /inventarios/:id
      const { data } = await api.get(`/inventarios/${itemId}`);
      return data;
    } catch (error) {
      console.error('❌ Erro ao buscar item:', error);
      return null;
    }
  }, []);

  return {
    inventory,
    loading,
    selectedItem,
    historicoId,
    setHistoricoId,
    loadInventory,
    handleItemClick,
    getQuantityDisplay,
    isSelected,
    handleAction,
    handleSave,
    handleUpdateDinheiro,
    handleDeleteItem,
    deleteInventory,
    setSelectedItem,
    fetchItem,
    error
  };
};